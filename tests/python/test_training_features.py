"""Tests for the feature extraction in train_jaundice_neural_net.py.

Run from the project root:  python -m unittest discover -s tests/python -v
"""
import os
import sys
import unittest

import numpy as np

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
import train_jaundice_neural_net as t  # noqa: E402


def uniform(r, g, b, side=16):
    img = np.zeros((side, side, 3), dtype=np.float64)
    img[..., 0], img[..., 1], img[..., 2] = r, g, b
    return img


def named(features):
    return dict(zip(t.FEATURE_NAMES, features))


class FixedHistTest(unittest.TestCase):
    def test_values_outside_the_range_land_in_the_end_bins(self):
        values = np.array([-10.0, 39.999, 40.0, 100.0, -50.0])
        hist = t.fixed_hist(values, -10, 40, 10)
        self.assertEqual(hist, [0.4, 0, 0, 0, 0, 0, 0, 0, 0, 0.6])

    def test_a_value_on_a_bin_edge_goes_to_the_upper_bin(self):
        hist = t.fixed_hist(np.array([0.5]), 0, 1, 8)
        self.assertEqual(hist, [0, 0, 0, 0, 1.0, 0, 0, 0])

    def test_2d_histogram_is_row_major_with_the_first_value_as_the_row(self):
        hist = t.fixed_hist2d(np.array([0.0, 35.9, 7.0]), np.array([0.0, 47.9, 40.0]), 0, 36, 0, 48, 6)
        self.assertEqual(len(hist), 36)
        self.assertAlmostEqual(hist[0], 1 / 3)       # a bin 0, b bin 0
        self.assertAlmostEqual(hist[35], 1 / 3)      # a bin 5, b bin 5
        self.assertAlmostEqual(hist[1 * 6 + 5], 1 / 3)  # a = 7 -> bin 1, b = 40 -> bin 5


class PercentileTest(unittest.TestCase):
    def test_matches_numpy_linear_interpolation(self):
        values = np.array([3.0, 1.0, 4.0, 1.5, 9.0, 2.6])
        for q in (0, 50, 90, 95, 100):
            self.assertAlmostEqual(t.percentile(values, q), float(np.percentile(values, q)), places=12)


class AnalyseRgbTest(unittest.TestCase):
    def test_feature_names_and_groups_cover_101_features_once(self):
        self.assertEqual(len(t.FEATURE_NAMES), 101)
        self.assertEqual(len(set(t.FEATURE_NAMES)), 101)
        self.assertEqual(
            sorted(t.FEATURE_GROUPS),
            sorted(["skin_yellow", "skin_pink", "yellow_pink_balance", "skin_brightness", "colour_strength"]),
        )
        grouped = [name for names in t.FEATURE_GROUPS.values() for name in names]
        self.assertEqual(sorted(grouped), sorted(t.FEATURE_NAMES))

    def test_only_skin_is_measured_not_the_background(self):
        # The model must not be able to read the bed, the lamp or how much of the frame is skin
        for name in t.FEATURE_NAMES:
            self.assertTrue(name.startswith("skin_") or name.startswith("rel_"), name)
        self.assertNotIn("skin_fraction", t.FEATURE_NAMES)

    def test_black_image_still_gives_finite_features_and_no_skin(self):
        features, skin_count = t.analyse_rgb(uniform(0, 0, 0))
        self.assertEqual(skin_count, 0)
        self.assertEqual(len(features), 101)
        self.assertTrue(np.all(np.isfinite(features)))

    def test_skin_coloured_image_is_all_skin(self):
        features, skin_count = t.analyse_rgb(uniform(200, 150, 120))
        self.assertEqual(skin_count, 256)
        f = named(features)
        self.assertEqual(len(features), 101)
        self.assertAlmostEqual(f["skin_std_b"], 0.0, places=9)
        self.assertGreater(f["skin_mean_a"], 6.0)
        self.assertAlmostEqual(sum(f[f"skin_hist_a_{i}"] for i in range(10)), 1.0)

    def test_blue_image_has_no_skin_and_falls_back_to_all_pixels(self):
        features, skin_count = t.analyse_rgb(uniform(40, 80, 200))
        self.assertEqual(skin_count, 0)
        self.assertLess(named(features)["skin_mean_b"], 0.0)  # blue has a negative b*

    def test_skin_is_compared_with_the_brightest_part_of_the_picture(self):
        # left half white sheet, right half skin: the reference is the sheet
        img = uniform(200, 150, 120, side=32)
        img[:, :16] = 250
        f = named(t.analyse_rgb(img)[0])
        skin_L, skin_a, skin_b = (float(v[0, 0]) for v in t.rgb_to_cielab(uniform(200, 150, 120) / 255.0))
        white_L, white_a, white_b = (float(v[0, 0]) for v in t.rgb_to_cielab(uniform(250, 250, 250) / 255.0))
        self.assertAlmostEqual(f["rel_L"], skin_L - white_L, places=6)
        self.assertAlmostEqual(f["rel_a"], skin_a - white_a, places=6)
        self.assertAlmostEqual(f["rel_b"], skin_b - white_b, places=6)

    def test_warm_white_sheet_is_not_counted_as_skin(self):
        _, skin_count = t.analyse_rgb(uniform(235, 225, 200))
        self.assertEqual(skin_count, 0)

    def test_yellow_skin_with_little_red_is_still_skin(self):
        # strongly jaundiced skin: yellow (high b*), not much red (a* below 6)
        rgb = uniform(176, 160, 96)
        L, a, b = t.rgb_to_cielab(rgb / 255.0)
        self.assertLess(float(a[0, 0]), 6.0)
        self.assertGreater(float(b[0, 0]), 22.0)
        _, skin_count = t.analyse_rgb(rgb)
        self.assertEqual(skin_count, 256)

    def test_all_features_are_finite(self):
        rng = np.random.RandomState(0)
        features, _ = t.analyse_rgb(rng.randint(0, 256, size=(32, 32, 3)).astype(np.float64))
        self.assertTrue(np.all(np.isfinite(features)))


if __name__ == "__main__":
    unittest.main()
