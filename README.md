# JaundiceCare

A first check for newborn jaundice from a photo of a baby's skin, with a small
pharmacy flow for medicines a doctor has prescribed. Built for a hackathon.

It is **not a medical device and not a diagnosis**. See [Limits](#limits).

## What it does

- **Photo check.** Pick a photo, use the camera, or try a sample. The app finds
  the skin, measures its colour and gives a score from 0 to 100. From 50 it
  reports "signs of jaundice seen".
- **Shows why.** The result shows the skin that was measured, where the yellow
  tone is strongest, and which colour signals raised or lowered the score.
- **Warning-sign questions.** Seven questions lead to one of three pieces of
  advice: go to hospital now, see a doctor today, or keep watching.
- **History and report.** Checks are saved in the browser, shown on a chart, and
  can be printed or saved as PDF.
- **English and Hindi** on every parent screen.
- **Pharmacy.** Send a prescription, a pharmacist checks it, the order is tracked.
  A pharmacist dashboard and an admin dashboard are included as demo roles.

Everything runs in the browser. Photos are never uploaded, and there is no server.

## Run it

```bash
npm install
npm run dev
```

Then open the address Vite prints (usually http://localhost:5173).

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the app for development |
| `npm run build` | Type-check and build into `dist/` |
| `npm run lint` | Lint the code |
| `npm test` | Run the automated tests (Node's built-in runner, no extra packages) |
| `python -m unittest discover -s tests/python` | Test the Python feature code |

## The model

`train_jaundice_neural_net.py` reads the photos in `jaundice/` and `normal/`
and writes the files the app uses:

| File | Contents |
| --- | --- |
| `src/ml/model.json` | Weights of the two models |
| `src/ml/modelInfo.json` | Accuracy numbers, decision line, sample list |
| `tests/fixtures/parity.json` | Pixel buffers and expected values for `npm test` |
| `public/samples/` | Six demo photos kept out of training |

To retrain (needs Python with `numpy`, `Pillow` and `scikit-learn`):

```bash
python train_jaundice_neural_net.py
npm test
```

How it works:

1. The photo is resized to 256 x 256.
2. Skin pixels are found with a colour rule.
3. 101 numbers describe the skin colour: averages, histograms, and how the skin
   compares with the brightest part of the picture (usually the sheet), which
   cancels the colour of the light.
4. A small neural network and a small gradient-boosted tree model each give a
   probability; the app averages them.

The feature code exists twice: in Python for training and in
`src/ml/features.ts` for the browser. `npm test` feeds both the same pixels and
fails if they disagree, so keep the two in step.

### Accuracy

Measured with 5-fold cross-validation, repeated three times, on photos the
models did not train on. The current numbers are in `src/ml/modelInfo.json`
and are what the app shows:

- right 83 in 100 times
- catches 83 in 100 babies with jaundice
- false alarm for 17 in 100 healthy babies
- ROC-AUC 0.906

## Limits

- **One dataset.** All 760 photos come from one hospital dataset. Photos taken
  at home, with other cameras or other lighting, may give different results.
- **Skin only, on purpose.** Features that describe the background (the bed,
  lamps, how much of the frame is skin) could separate this dataset by
  themselves, because jaundiced babies are often photographed under
  phototherapy lamps. They were left out so the model looks at the baby, not the
  room. This costs about one point of measured accuracy.
- **The same baby may appear in several photos.** That would make the measured
  accuracy a little optimistic. Exact copies are kept together during
  evaluation; different photos of one baby cannot be detected.
- **Demo samples.** The six sample photos show no faces. They were picked from
  18 such photos, of which the model gets 14 right, so one of the six is a
  photo the model gets wrong (a false alarm) to keep the demo honest.
- **Photos of real patients.** Check the dataset's licence before publishing
  the app or the samples online.
- **Camera.** Camera capture has not been tested on a real phone.
- **Hindi.** The medical wording should be reviewed by a native-speaking
  clinician before real use.
- **Pharmacy data is invented.** People, pharmacies, phone and registration
  numbers are made up, and no payment or delivery really happens.

## Project layout

```
train_jaundice_neural_net.py   training, evaluation, export
src/app/        entry point, styles and design tokens
src/ml/         feature extraction, models, explanation, overlays (pure) + browser glue
src/logic/      advice from the warning-sign answers, order rules, ids (pure)
src/storage/    history in localStorage (pure)
src/i18n/       English and Hindi text
src/state/      app state and actions
src/screens/    one folder per screen
src/layout/     header and footer
src/ui/         small building blocks (button, card, dialog, ...)
tests/          automated tests and fixtures
docs/           screenshots
```

Modules marked "pure" have no browser dependencies and are tested directly in
Node. They import each other with explicit `.ts` extensions so Node can run them.

## Licence

The code is released under the [MIT licence](LICENSE). The licence does not
cover the dataset photos, including the six samples in `public/samples/`.
