# Ancestral Encounters

Website for **Ancestral Encounters** — healing ceremonies, teaching classes, and guided land journeys rooted in ancestral tradition.

A simple static site (HTML, CSS, JavaScript — no build step, no dependencies). Easy to edit and free to host.

## Pages

| File | Page |
|------|------|
| `index.html` | Home |
| `story.html` | Our Story (history & culture) |
| `healing.html` | Healing & Journeys (ceremonies, classes, trips) |
| `contact.html` | Connect (contact form) |

## Viewing it locally

Just open `index.html` in a browser. Or run a tiny local server:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Editing content

- **Text:** All copy lives directly in the `.html` files. Look for text marked `[Replace this ...]` / `[Edit ...]` — those are placeholders meant to be swapped for the tribe's real words.
- **Colors & fonts:** Change the variables at the top of `css/style.css` (the `:root` block) to reskin the whole site at once.
- **Photos:** Drop images into the `images/` folder. A hero photo named `images/hero.jpg` will automatically appear behind the home page headline.
- **Contact form:** Currently front-end only. See the comments in `js/main.js` for how to connect it to email via a free service like [Formspree](https://formspree.io).

## Hosting (free, via GitHub Pages)

In the GitHub repo: **Settings → Pages → Build from branch → `main` / root**. The site goes live at `https://<user>.github.io/ancestral-encounters/` within a minute or two.

---

Offered with respect and gratitude. 🌎
