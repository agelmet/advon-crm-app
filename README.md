# Advon CRM

Angelo's private CRM — https://crm.advonmedia.com (GitHub Pages, custom domain).

- One file: `index.html`. Every change here goes live in ~1 minute with **0 Netlify credits**.
- The data is NOT in this repo: it lives encrypted in the private repo `agelmet/advon-crm-data`
  and is read/written through the API on advonmedia.com (`/api/crm`, `/api/pool`, `/api/chat`, …),
  which allows this address via CORS (`lib/crmcors.js` in advon-media-visual).
- Opening the CRM needs the passphrase; without it nothing can be read.
- The public demo (advonmedia.com/crm-demo) is a separate copy in advon-media-visual and is
  updated only when Angelo asks.
