# Portfolio site structure

Static HTML/CSS/JavaScript site for Long Geng’s design portfolio. GitHub Pages publishes from the repository root (`index.html` → `Me.html#/`).

## Overview

The live app is a persistent workspace: left sidebar + right content. Hash routes on `Me.html` load chat, Library, Resume, Contact, Approach, and project case studies (iframes). Interactive product prototypes are standalone pages and are not merged into the case-study DOM.

## Directory tree

```
index.html                 GitHub Pages entry (redirects to Me.html#/)
Me.html                    App shell (New Chat, Approach, Library, Resume, Projects, Contact)
favicon.ico
Write.html …               Compatibility redirects for previously published URLs
package.json               live-server only

pages/
  approach/index.html
  contact/index.html

projects/
  write/                   Tax Advice AI case study + Write Builder prototype
  pathfinder/              Regulatory Pathfinder case study (no public prototype)
  agent-os/                Agent OS case study + Agent OS Builder prototype
  chat-pwc/
  ai-design-system/
  ma-path/
  pulse/
  dcb/

assets/
  css/                     Shared styles (tokens, workspace, Bootstrap, …)
  js/                      Shared scripts (workspace, knowledge, sidebar, …)
  images/shared/           Logos, homepage thumbnails, icons used by more than one surface
  images/unassigned/       Preserved assets with no live reference
  media/                   Resume PDF

scripts/                   Local tooling (not required at runtime)
docs/                      Structure and migration notes
```

Project-exclusive CSS, JS, images and videos live under that project’s `assets/` folder.

## Case studies vs prototypes

| Role | Location | URL |
| --- | --- | --- |
| Case study | `projects/<slug>/index.html` | `/projects/write/` |
| Prototype | `projects/<slug>/prototype/index.html` | `/projects/write/prototype/` |

Case studies open inside the `Me.html` workspace (`#/project/...`). Prototypes are separate apps: do not combine their CSS/JS with the case study.

MAP, Pulse and DCB remain in the sidebar and Selected Work, so they are filed as `projects/ma-path`, `projects/pulse` and `projects/dcb` — not under a legacy folder.

## Shared vs project media

- Used by the shell, multiple projects, or homepage cards → `assets/images/shared/`
- Used by one project → `projects/<slug>/assets/images/` (and `videos/` when needed)
- Uncertain → keep (currently `assets/images/unassigned/` or the likely project folder)

Do not put global CSS/JS copies inside each project.

## Navigation and project registration

Edit these together when adding a project:

1. `assets/js/portfolio-knowledge.js` — project object (id, names, thumb, href `Me.html#/project/<slug>`, flags)
2. `assets/js/workspace-app.js` — `PROJECT_ROUTES` / `PROJECT_ID_TO_SLUG` / `NAV_LABELS`
3. `assets/js/embed-boot.js` — standalone → hash redirect
4. Root `YourProject.html` stub if a public URL must keep working

Sidebar, Selected Work, Library and chat answers all read from `portfolio-knowledge.js`.

## Add a new project

1. Create `projects/<slug>/index.html` using the existing case-study shell (embed-boot + site-base + shared CSS/JS).
2. If there is a prototype, add `projects/<slug>/prototype/index.html` and keep its assets isolated.
3. Put exclusive media in `projects/<slug>/assets/`.
4. Register the project in the four files above.
5. Keep `Me.html` at the repo root (it is the app, not an About page).

## Temporary exports

Standalone HTML/zip exports belong outside the published tree (local archive). `shareable-export/` is gitignored. Rebuild from `scripts/` if needed; do not commit generated zips.

## Run locally

```bash
npm install
npm start
```

Opens `http://127.0.0.1:8080/` (`index.html` → `Me.html#/`).

## GitHub Pages

- Publish from the **repository root** (user site `*.github.io`, no `/docs` workflow in this repo).
- Keep `index.html` at root.
- Nested routes such as `/projects/write/` work as static folders.
- Previously published `Write.html` (and similar) remain as small redirect stubs.

## npm

`package.json` / `package-lock.json` stay at the repo root. The only dependency is `live-server` (dev). `node_modules/` is gitignored.
