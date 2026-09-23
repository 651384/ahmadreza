# Catalog QA Report

## Automated checks
- [x] JSON parses successfully and contains 13 entries.
- [x] CSV contains 13 product rows.
- [x] Every JSON entry has an id, title, category, source page, and image path.
- [x] Every referenced asset exists under `catalog/assets/`.
- [x] Source PDF remains at its original path; no runtime files changed.

## Functional checks
- [x] Search filters by name, subcategory, and feature text.
- [x] Category filter switches between Hospital beds and Patient room furniture.
- [x] Product cards open a detail dialog.
- [x] Detail view displays source image, source page, translated/source names, and documented features.
- [x] Source PDF links open the repository raw URL.

## Responsive review
- Desktop: four-column grid and two-column hero.
- Tablet: two-column grid, stacked controls.
- Mobile: one-column cards, compact hero, stacked detail dialog.

## Limitations
Tiny icon-row numeric labels and some Persian body copy are explicitly unresolved rather than inferred; see `unresolved-items.md`.
