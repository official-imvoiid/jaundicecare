"""Train the JaundiceCare newborn skin-colour model.

Reads the photos in jaundice/ and normal/, measures 101 skin-colour features per
photo, cross-validates, trains the two models the app averages, and writes:

  src/ml/model.json           weights (loaded by the app on demand)
  src/ml/modelInfo.json       version, evaluation numbers, decision line, samples
  tests/fixtures/parity.json  pixel buffers + expected values for `npm test`
  public/samples/*.jpg        demo photos that were kept out of training

NOTE: src/ml/features.ts re-implements analyse_rgb() for the browser. Any
change to the constants, formulas or feature order below must be mirrored
there; `npm test` compares the two on the fixtures written here.
"""
import base64
import datetime
import glob
import json
import os
import shutil

import numpy as np
from PIL import Image
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.metrics import roc_auc_score, roc_curve
from sklearn.model_selection import StratifiedGroupKFold
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import StandardScaler

ROOT = os.path.dirname(os.path.abspath(__file__))
MODEL_VERSION = "3.0"

ANALYSIS_SIZE = 256

# Skin: YCbCr chroma box, then either reddish or clearly yellow and not near-white
SKIN_MIN_L = 20.0
SKIN_MIN_A = 6.0
SKIN_YELLOW_MIN_B = 22.0
SKIN_YELLOW_MAX_L = 82.0
MIN_SKIN_PIXELS = 200

# The brightest 5% of the picture (usually the sheet) is the lighting reference
BRIGHT_PERCENTILE = 95

# Demo photos shown in the app. They are never used for training or evaluation.
# They come from 18 photos in which no face is visible; cross-validated models
# classified 14 of those 18 correctly, so one of the six shown is a photo the
# model is expected to get wrong.
DEMO_SAMPLES = [
    ("sample-1.jpg", "normal", 988),
    ("sample-2.jpg", "jaundice", 62),
    ("sample-3.jpg", "normal", 821),
    ("sample-4.jpg", "jaundice", 32),
    ("sample-5.jpg", "normal", 917),
    ("sample-6.jpg", "jaundice", 65),
]

# Only the skin is measured. Features describing the bed, the lamp or how much
# of the frame is skin could separate this dataset on their own (AUC 0.80), but
# a photo taken at home will not share the hospital background.
SKIN_STATS = [
    "skin_mean_L", "skin_mean_a", "skin_mean_b", "skin_std_L", "skin_std_a", "skin_std_b",
    "skin_mean_sat", "skin_p90_b", "skin_median_a", "skin_b_over_a",
    "skin_mean_cb", "skin_mean_cr",
]
HIST_A = [f"skin_hist_a_{i}" for i in range(10)]
HIST_B = [f"skin_hist_b_{i}" for i in range(10)]
HIST_L = [f"skin_hist_L_{i}" for i in range(8)]
HIST_SAT = [f"skin_hist_sat_{i}" for i in range(8)]
HIST_AB = [f"skin_hist_ab_{i}_{j}" for i in range(6) for j in range(6)]
HIST_HUE = [f"skin_hist_hue_{i}" for i in range(9)]
HUE_STATS = ["skin_mean_hue", "skin_std_hue", "skin_mean_chroma"]
REL = ["rel_a", "rel_b", "rel_L", "rel_p90_b", "rel_hue"]

FEATURE_NAMES = SKIN_STATS + HIST_A + HIST_B + HIST_L + HIST_SAT + HIST_AB + HIST_HUE + HUE_STATS + REL

# Which features belong to which plain-language signal in the app's "why" panel
FEATURE_GROUPS = {
    "skin_yellow": ["skin_mean_b", "skin_std_b", "skin_p90_b", "skin_mean_cb"] + HIST_B + ["rel_b", "rel_p90_b"],
    "skin_pink": ["skin_mean_a", "skin_std_a", "skin_median_a", "skin_mean_cr"] + HIST_A + ["rel_a"],
    "yellow_pink_balance": ["skin_b_over_a"] + HIST_AB + HIST_HUE + ["skin_mean_hue", "skin_std_hue", "rel_hue"],
    "skin_brightness": ["skin_mean_L", "skin_std_L"] + HIST_L + ["rel_L"],
    "colour_strength": ["skin_mean_sat", "skin_mean_chroma"] + HIST_SAT,
}

DEGREES = 180.0 / np.pi


def rgb_to_cielab(rgb):
    """sRGB in [0, 1], shape (..., 3) -> (L*, a*, b*) under D65."""
    lin = np.where(rgb > 0.04045, ((rgb + 0.055) / 1.055) ** 2.4, rgb / 12.92)
    r, g, b = lin[..., 0], lin[..., 1], lin[..., 2]

    X = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047
    Y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.00000
    Z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883

    def f(t):
        return np.where(t > 0.008856, np.cbrt(t), 7.787 * t + 16.0 / 116.0)

    fX, fY, fZ = f(X), f(Y), f(Z)
    return 116.0 * fY - 16.0, 500.0 * (fX - fY), 200.0 * (fY - fZ)


def fixed_hist(values, lo, hi, bins):
    """Share of values per bin. bin = clamp(floor((v - lo) / (hi - lo) * bins), 0, bins - 1)."""
    idx = np.floor((values - lo) / (hi - lo) * bins).astype(np.int64)
    idx = np.clip(idx, 0, bins - 1)
    return (np.bincount(idx, minlength=bins) / len(values)).tolist()


def fixed_hist2d(u, v, u_lo, u_hi, v_lo, v_hi, bins):
    """Share of (u, v) pairs per cell, row-major with u as the row."""
    iu = np.clip(np.floor((u - u_lo) / (u_hi - u_lo) * bins).astype(np.int64), 0, bins - 1)
    iv = np.clip(np.floor((v - v_lo) / (v_hi - v_lo) * bins).astype(np.int64), 0, bins - 1)
    return (np.bincount(iu * bins + iv, minlength=bins * bins) / len(u)).tolist()


def percentile(values, q):
    """Linear-interpolated percentile: sort, then s[lo] + (s[hi] - s[lo]) * t."""
    s = np.sort(np.asarray(values, dtype=np.float64).ravel())
    pos = (len(s) - 1) * q / 100
    lo = int(np.floor(pos))
    hi = min(lo + 1, len(s) - 1)
    return float(s[lo] + (s[hi] - s[lo]) * (pos - lo))


def analyse_rgb(rgb):
    """rgb: float array (H, W, 3) in [0, 255].

    Returns (features in FEATURE_NAMES order, number of skin pixels found).
    When fewer than MIN_SKIN_PIXELS look like skin the whole picture is
    measured instead; the app refuses to score such a photo.
    """
    R, G, B = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    L, a, b = rgb_to_cielab(rgb / 255.0)

    max_c = rgb.max(axis=2)
    min_c = rgb.min(axis=2)
    sat = np.where(max_c > 0, (max_c - min_c) / np.maximum(max_c, 1e-9), 0.0)

    cb = 128.0 - 0.168736 * R - 0.331264 * G + 0.5 * B
    cr = 128.0 + 0.5 * R - 0.418688 * G - 0.081312 * B

    skin = (
        (cr > 133) & (cr < 173) & (cb > 77) & (cb < 127) & (L > SKIN_MIN_L)
        & ((a > SKIN_MIN_A) | ((b > SKIN_YELLOW_MIN_B) & (L < SKIN_YELLOW_MAX_L)))
    )
    skin_count = int(np.sum(skin))
    region = skin if skin_count >= MIN_SKIN_PIXELS else np.ones_like(skin)
    sL, sa, sb, ss = L[region], a[region], b[region], sat[region]

    mean_L, mean_a, mean_b = float(np.mean(sL)), float(np.mean(sa)), float(np.mean(sb))
    p90_b = percentile(sb, 90)
    skin_stats = [
        mean_L, mean_a, mean_b,
        float(np.std(sL)), float(np.std(sa)), float(np.std(sb)),
        float(np.mean(ss)),
        p90_b, percentile(sa, 50),
        float(np.mean(sb / np.maximum(sa, 1.0))),
        float(np.mean(cb[region])), float(np.mean(cr[region])),
    ]

    hue = np.arctan2(sb, np.maximum(sa, 1e-6)) * DEGREES
    mean_hue = float(np.mean(hue))
    hue_stats = [mean_hue, float(np.std(hue)), float(np.mean(np.sqrt(sa ** 2 + sb ** 2)))]

    # Skin compared with the brightest part of the picture, to cancel the colour of the light
    bright = L >= percentile(L, BRIGHT_PERCENTILE)
    bright_L = float(np.mean(L[bright]))
    bright_a = float(np.mean(a[bright]))
    bright_b = float(np.mean(b[bright]))
    rel = [
        mean_a - bright_a,
        mean_b - bright_b,
        mean_L - bright_L,
        p90_b - bright_b,
        mean_hue - float(np.arctan2(bright_b, max(bright_a, 1e-6)) * DEGREES),
    ]

    features = (
        skin_stats
        + fixed_hist(sa, -10, 40, 10) + fixed_hist(sb, -10, 50, 10)
        + fixed_hist(sL, 20, 100, 8) + fixed_hist(ss, 0, 1, 8)
        + fixed_hist2d(sa, sb, 0, 36, 0, 48, 6)
        + fixed_hist(hue, 0, 90, 9) + hue_stats
        + rel
    )
    return features, skin_count


def load_rgb(path, size):
    try:
        img = Image.open(path).convert("RGB").resize((size, size), Image.BILINEAR)
        return np.asarray(img, dtype=np.float64)
    except Exception as e:
        print(f"Skipping {path}: {e}")
        return None


def dataset_path(folder, number):
    return os.path.join(ROOT, folder, f"{folder} ({number}).jpg")


def load_dataset():
    """Features for every readable photo: (X, y, paths, 16x16 grey thumbnails)."""
    X, y, paths, thumbs = [], [], [], []
    for label, folder in ((1, "jaundice"), (0, "normal")):
        for path in sorted(glob.glob(os.path.join(ROOT, folder, "*.jpg"))):
            rgb = load_rgb(path, ANALYSIS_SIZE)
            if rgb is None:
                continue
            features, _ = analyse_rgb(rgb)
            X.append(features)
            y.append(label)
            paths.append(path)
            thumbs.append(rgb.reshape(16, 16, 16, 16, 3).mean(axis=(1, 3, 4)).ravel())
    return np.array(X), np.array(y), paths, np.array(thumbs)


def duplicate_groups(thumbs):
    """Group id per photo. Copies of the same photo (mean grey difference below 2) share an id,
    so cross-validation never trains on one copy and tests on the other."""
    parent = list(range(len(thumbs)))

    def find(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i

    for i in range(len(thumbs) - 1):
        diff = np.abs(thumbs[i + 1:] - thumbs[i]).mean(axis=1)
        for j in np.where(diff < 2.0)[0]:
            parent[find(i + 1 + int(j))] = find(i)
    roots = np.array([find(i) for i in range(len(thumbs))])
    return np.unique(roots, return_inverse=True)[1]


def fit_mlp(X, y):
    """Scale, balance the classes by repeating jaundice samples, and train the neural network."""
    rng = np.random.RandomState(42)
    pos = np.where(y == 1)[0]
    neg = np.where(y == 0)[0]
    if len(pos) < len(neg):
        extra = rng.choice(pos, len(neg) - len(pos))
    else:
        extra = rng.choice(neg, len(pos) - len(neg))
    X_bal = np.vstack([X, X[extra]])
    y_bal = np.concatenate([y, y[extra]])

    scaler = StandardScaler()
    clf = MLPClassifier(hidden_layer_sizes=(32, 16), activation='relu', solver='adam', max_iter=1000, random_state=42)
    clf.fit(scaler.fit_transform(X_bal), y_bal)
    return scaler, clf


def fit_gbt(X, y):
    clf = HistGradientBoostingClassifier(
        max_iter=200, learning_rate=0.08, max_leaf_nodes=12, min_samples_leaf=10,
        l2_regularization=1.0, class_weight="balanced", random_state=0,
    )
    return clf.fit(X, y)


def fit_models(X, y):
    return fit_mlp(X, y), fit_gbt(X, y)


def predict_models(models, X):
    """Probability of jaundice: the average of the neural network and the tree model."""
    (scaler, mlp), gbt = models
    return 0.5 * (mlp.predict_proba(scaler.transform(X))[:, 1] + gbt.predict_proba(X)[:, 1])


def cross_validate(X, y, groups, seeds=(11, 12, 13)):
    """5-fold cross-validation repeated per seed: every photo is scored by models that never saw it."""
    runs = []
    for seed in seeds:
        probs = np.zeros(len(y))
        for train_idx, test_idx in StratifiedGroupKFold(5, shuffle=True, random_state=seed).split(X, y, groups):
            probs[test_idx] = predict_models(fit_models(X[train_idx], y[train_idx]), X[test_idx])
        runs.append(probs)

    # Decision line: the point where a jaundice photo is as likely to be caught as a
    # normal photo is to be cleared (sensitivity = specificity)
    fpr, tpr, thresholds = roc_curve(np.tile(y, len(seeds)), np.concatenate(runs))
    threshold = round(float(thresholds[np.argmin(np.abs(tpr - (1 - fpr)))]), 3)

    stats = []
    for probs in runs:
        pred = probs >= threshold
        stats.append([
            roc_auc_score(y, probs),
            float(np.mean(pred == y)),
            float(np.mean(pred[y == 1])),
            float(np.mean(~pred[y == 0])),
        ])
    auc, accuracy, sensitivity, specificity = np.mean(stats, axis=0)
    return {
        "method": f"5-fold cross-validation, {len(seeds)} repeats",
        "auc": round(float(auc), 3),
        "accuracy": round(float(accuracy * 100), 1),
        "sensitivity": round(float(sensitivity * 100), 1),
        "specificity": round(float(specificity * 100), 1),
    }, threshold


def significant(value, digits):
    return float(f"{float(value):.{digits}g}")


def export_models(models):
    (scaler, mlp), gbt = models
    trees = []
    for predictors in gbt._predictors:
        f, t, l, r, v = [], [], [], [], []
        for node in predictors[0].nodes:
            if node["is_leaf"]:
                f.append(-1); t.append(0); l.append(0); r.append(0); v.append(significant(node["value"], 8))
            else:
                # Thresholds stay at full precision: histogram features of different photos can
                # differ by less than 1e-9, and a rounded threshold sends such a photo down the other branch
                f.append(int(node["feature_idx"])); t.append(float(node["num_threshold"]))
                l.append(int(node["left"])); r.append(int(node["right"])); v.append(0)
        trees.append({"f": f, "t": t, "l": l, "r": r, "v": v})
    return {
        "mlp": {
            "mean": [significant(m, 10) for m in scaler.mean_],
            "scale": [significant(s, 10) for s in scaler.scale_],
            "weights": [[[round(float(w), 6) for w in row] for row in layer] for layer in mlp.coefs_],
            "biases": [[round(float(w), 6) for w in layer] for layer in mlp.intercepts_],
        },
        # A sample goes left when feature f <= threshold t; f = -1 marks a leaf with value v
        "gbt": {"baseline": float(np.ravel(gbt._baseline_prediction)[0]), "trees": trees},
    }


def predict_from_export(model, X):
    """Plain numpy evaluation of the exported weights: the reference for src/ml/model.ts."""
    X = np.asarray(X, dtype=np.float64)
    mlp = model["mlp"]
    act = (X - np.array(mlp["mean"])) / np.array(mlp["scale"])
    last = len(mlp["weights"]) - 1
    for i, (weights, biases) in enumerate(zip(mlp["weights"], mlp["biases"])):
        act = act @ np.array(weights) + np.array(biases)
        if i < last:
            act = np.maximum(act, 0)
    p_mlp = 1.0 / (1.0 + np.exp(-act[:, 0]))

    gbt = model["gbt"]
    raw = np.full(len(X), gbt["baseline"], dtype=np.float64)
    for tree in gbt["trees"]:
        for row, x in enumerate(X):
            node = 0
            while tree["f"][node] >= 0:
                node = tree["l"][node] if x[tree["f"][node]] <= tree["t"][node] else tree["r"][node]
            raw[row] += tree["v"][node]
    p_gbt = 1.0 / (1.0 + np.exp(-raw))
    return p_mlp, p_gbt, 0.5 * (p_mlp + p_gbt)


def fixture_case(name, rgb, model):
    features, skin_count = analyse_rgb(rgb)
    p_mlp, p_gbt, p = predict_from_export(model, [features])
    return {
        "name": name,
        "width": int(rgb.shape[1]),
        "height": int(rgb.shape[0]),
        "rgb": base64.b64encode(rgb.astype(np.uint8).tobytes()).decode("ascii"),
        "features": features,
        "skinCount": skin_count,
        "skinFound": skin_count >= MIN_SKIN_PIXELS,
        "mlp": float(p_mlp[0]),
        "gbt": float(p_gbt[0]),
        "probability": float(p[0]),
    }


def uniform_image(r, g, b, side=16):
    img = np.zeros((side, side, 3), dtype=np.float64)
    img[..., 0], img[..., 1], img[..., 2] = r, g, b
    return img


def main():
    print("Measuring the dataset photos...")
    X, y, paths, thumbs = load_dataset()
    groups = duplicate_groups(thumbs)

    sample_paths = {os.path.normcase(dataset_path(folder, number)) for _, folder, number in DEMO_SAMPLES}
    is_sample = np.array([os.path.normcase(p) in sample_paths for p in paths])
    if is_sample.sum() != len(DEMO_SAMPLES):
        raise SystemExit("A demo sample photo is missing from the dataset folders")
    # Keep the samples, and any copy of them, away from training and evaluation
    held_out = np.isin(groups, groups[is_sample])
    Xt, yt, gt = X[~held_out], y[~held_out], groups[~held_out]

    evaluation, threshold = cross_validate(Xt, yt, gt)
    print("\n--- RESULTS on photos the models never saw (cross-validation) ---")
    print(f"Photos used: {len(yt)} ({int(yt.sum())} jaundice, {int((yt == 0).sum())} normal); held out: {int(held_out.sum())}")
    print(f"Decision line: {threshold}")
    print(f"Accuracy: {evaluation['accuracy']}%   Sensitivity: {evaluation['sensitivity']}%   "
          f"Specificity: {evaluation['specificity']}%   ROC-AUC: {evaluation['auc']}")

    # The models shipped to the app are trained on every training photo
    models = fit_models(Xt, yt)
    model = {
        "version": MODEL_VERSION,
        "featureNames": FEATURE_NAMES,
        "groups": {name: [FEATURE_NAMES.index(f) for f in members] for name, members in FEATURE_GROUPS.items()},
        "reference": {
            "normal": [significant(v, 8) for v in Xt[yt == 0].mean(axis=0)],
            "jaundice": [significant(v, 8) for v in Xt[yt == 1].mean(axis=0)],
        },
        "threshold": threshold,
        **export_models(models),
    }

    # The rounded export must still behave like the trained models
    drift = float(np.max(np.abs(predict_from_export(model, Xt)[2] - predict_models(models, Xt))))
    if drift > 1e-5:
        raise SystemExit(f"Exported weights drift from the trained models by {drift}")

    os.makedirs(os.path.join(ROOT, "src", "ml"), exist_ok=True)
    with open(os.path.join(ROOT, "src", "ml", "model.json"), "w") as f:
        json.dump(model, f, separators=(",", ":"))

    samples = []
    os.makedirs(os.path.join(ROOT, "public", "samples"), exist_ok=True)
    print("\nDemo samples (not used in training):")
    for file_name, folder, number in DEMO_SAMPLES:
        shutil.copyfile(dataset_path(folder, number), os.path.join(ROOT, "public", "samples", file_name))
        samples.append({"id": file_name.split(".")[0], "file": f"samples/{file_name}", "label": folder})
        features, _ = analyse_rgb(load_rgb(dataset_path(folder, number), ANALYSIS_SIZE))
        p = float(predict_from_export(model, [features])[2][0])
        print(f"  {file_name}: {folder:8s} -> probability {p:.3f} ({'signs seen' if p >= threshold else 'no signs'})")

    info = {
        "version": MODEL_VERSION,
        "trainedOn": datetime.date.today().isoformat(),
        "dataset": {
            "total": int(len(yt)),
            "jaundice": int(yt.sum()),
            "normal": int((yt == 0).sum()),
            "heldOutSamples": len(DEMO_SAMPLES),
        },
        "evaluation": evaluation,
        "threshold": threshold,
        # The app's "yellow areas" view tints skin from the typical normal yellow value (b*) upwards
        "yellowRange": {
            "low": round(model["reference"]["normal"][FEATURE_NAMES.index("skin_mean_b")], 1),
            "high": round(model["reference"]["normal"][FEATURE_NAMES.index("skin_mean_b")] + 15, 1),
        },
        "samples": samples,
    }
    with open(os.path.join(ROOT, "src", "ml", "modelInfo.json"), "w") as f:
        json.dump(info, f, indent=2)

    # Fixtures for `npm test`: the TypeScript code must reproduce these numbers from the same pixels
    cases = [fixture_case(file_name, load_rgb(dataset_path(folder, number), 64), model)
             for file_name, folder, number in DEMO_SAMPLES]
    half_sheet = uniform_image(200, 150, 120, side=32)
    half_sheet[:, :16] = 250
    cases += [
        fixture_case("black", uniform_image(0, 0, 0), model),
        fixture_case("blue-no-skin", uniform_image(40, 80, 200), model),
        fixture_case("warm-white-no-skin", uniform_image(235, 225, 200), model),
        fixture_case("uniform-skin", uniform_image(200, 150, 120), model),
        fixture_case("yellow-skin", uniform_image(176, 160, 96), model),
        fixture_case("skin-beside-white-sheet", half_sheet, model),
    ]
    os.makedirs(os.path.join(ROOT, "tests", "fixtures"), exist_ok=True)
    with open(os.path.join(ROOT, "tests", "fixtures", "parity.json"), "w") as f:
        json.dump({"cases": cases}, f, separators=(",", ":"))

    print("\nWrote src/ml/model.json, src/ml/modelInfo.json, tests/fixtures/parity.json and public/samples/")


if __name__ == "__main__":
    main()
