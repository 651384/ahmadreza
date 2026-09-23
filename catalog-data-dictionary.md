# Catalog Data Dictionary

| Field | Meaning | Rule |
|---|---|---|
| `id` | Stable catalog identifier | Lowercase, unique, URL-safe |
| `name` | English-first display title | Translation of visible source title; not a manufacturer claim beyond source |
| `nameFa` | Persian source-title transcription | Kept for traceability |
| `category` | High-level catalog group | Used by UI category filter |
| `subcategory` | Configuration/product type | Taken from title or visible product group |
| `sourcePage` | PDF page containing source entry | 1-based page number |
| `image` | Cropped product-region asset | Rendered from the supplied PDF; not external |
| `sourceText` | Visible source title | Persian transcription |
| `features` | Only visible/stated features | No inferred specifications |
| `technicalData` | Technical transcription caveat | Used where icon labels require verification |
| `status` | Extraction status | `documented` means title/image/category mapped; not that every tiny icon value is resolved |
