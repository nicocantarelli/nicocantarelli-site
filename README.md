# nicocantarelli.com

Personal site of Nicolas Cantarelli. Two static pages, no framework, no client-side JavaScript, no external requests. Typeset in Switzer (ITF Free Font License, see SWITZER-LICENSE.txt).

- `index.html` serves the homepage: work index with hover screenshots, AI gallery strip, thesis, services, contact.
- `gallery.html` serves `/gallery`, a masonry dump of images made with generative tools.

Hosted on Vercel as a plain static deploy. `vercel.json` handles clean URLs and permanent redirects from the old site's `/en` and `/it` paths.

## Adding gallery images

Drop image files into `images/gallery/originals/` and push. Name them `YYYY-MM-DD-something.png` so they sort newest first. A GitHub Action runs `scripts/build-gallery.mjs`, which:

1. Encodes each original into `images/gallery/avif/` (primary) and `images/gallery/jpg/` (fallback), capped at 2000px on the long edge.
2. Rewrites the marked region in `gallery.html` with one `<picture>` per image, newest first.
3. Rewrites the six-image strip in `index.html` with the six newest.

The action commits the results back to main and Vercel redeploys. Uploading through the GitHub web UI is enough, nothing needs to run locally. To run the build by hand: `npm install && npm run gallery`.

Originals are committed at full resolution so the gallery can be re-encoded later without losing sources.
