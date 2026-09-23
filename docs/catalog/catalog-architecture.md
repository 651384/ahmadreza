# Catalog Architecture

The catalog is a dependency-free static site in `catalog/`.

- `index.html`: semantic shell, hero, catalog controls, documentation note, detail dialog.
- `style.css`: responsive layout; desktop four-column listing, tablet two-column, mobile one-column.
- `app.js`: loads the root `catalog-products.json`, builds category filters, client-side search, product cards, and detail dialog.
- `assets/`: product-region crops rendered from the source PDF.
- Root JSON/CSV are the canonical structured exports.

The app intentionally does not alter or import the SIMOT-AI runtime and creates no Arena integration. The source PDF remains unchanged.
