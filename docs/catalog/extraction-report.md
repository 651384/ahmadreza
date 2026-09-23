# SIMOT Catalog Extraction Report

## Source
- Repository: `651384/ahmadreza`
- Branch: `master`
- File: `input/source/Hospital Bed catalog1 (1).pdf`
- Format: 2-page scanned/image PDF; no usable text layer was present.

## Phase 1 findings
- Pages: 2
- Catalog entries: 13 (4 on page 1, 9 on page 2)
- Page 1: mechanical bed, overbed table, bedside cabinet, bedside step.
- Page 2: nine hospital-bed configurations: VIP 2/3/4-motor (4 motor ICU/CCU); simple side-rail 2/3/4-motor (4 motor ICU/CCU); simple 2/3/4-motor (4 motor ICU/CCU).

## Method
Pages were rendered from the repository PDF and product regions were cropped from those renders. Each JSON entry includes `sourcePage`; each image is in `catalog/assets/`. No external product photography was used. Persian titles were visually transcribed and translated to English for the English-first interface. Small icon-row numbers are not normalized when the scan does not make them unambiguous.
