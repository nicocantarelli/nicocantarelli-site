# nicocantarelli.com

Personal site of Nicolas Cantarelli. Plain static HTML, no framework, no build step for the pages and no external requests. Typeset in Helvetica Now Display, self-hosted from `fonts/`.

- `index.html` serves the homepage: hero, selected work index with hover screenshots, availability, services, current work, about, thesis and contact. Its only script lights each work row's image band on touch devices, where there is no hover.
- `work/*.html` serve the case studies at `/work/<name>`: Baudie, Nirup Island, Tashola, Harbour Bay Downtown, WalkFully, Global Satellite Solutions, Timglas and Mimos AI. Each is a self-contained page with its own styles.
- `gallery.html` serves `/gallery`, a masonry dump of images made with generative tools. It is unlinked for now: the nav link and the homepage strip are commented out.

Hosted on Vercel as a plain static deploy. `vercel.json` handles clean URLs and permanent redirects from the old site's `/en` and `/it` paths.

## Adding a case study

1. Copy an existing page in `work/` and rewrite it. Full-size screenshots go in `images/work/`.
2. Add a row to the work index in `index.html`. Each row takes a thumbnail in `images/` (`--img` and the inline `<img>`) and three hover swatches in `images/px/` (`--s1`, `--s2`, `--s3`).

## Adding gallery images

Drop image files into `images/gallery/originals/` and push. Name them `YYYY-MM-DD-something.png` so they sort newest first. A GitHub Action runs `scripts/build-gallery.mjs`, which:

1. Encodes each original into `images/gallery/avif/` (primary) and `images/gallery/jpg/` (fallback), capped at 2000px on the long edge.
2. Rewrites the marked region in `gallery.html` with one `<picture>` per image, newest first.
3. Rewrites the six-image strip in `index.html` with the six newest. While the strip is commented out, the script skips this step.

The action commits the results back to main and Vercel redeploys. Uploading through the GitHub web UI is enough, nothing needs to run locally. To run the build by hand: `npm install && npm run gallery`.

Originals are committed at full resolution so the gallery can be re-encoded later without losing sources.
