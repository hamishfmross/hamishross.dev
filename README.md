# hamishross.dev

My personal website: projects, blog, CV and contact details, self-hosted on a Raspberry Pi 5.

The homepage is a circuit board. Each component opens a page:

| Component | Page |
|---|---|
| FPGA (U1) | Projects |
| DDR4 memory (U2, U3) | CV |
| 100 MHz crystal (Y1) | Blog |
| USB-C and Ethernet (J1, J2) | Contact |
| Power regulator (U5) | About |

## How it works

- **No images.** The board is SVG generated in JavaScript from a list of components and their positions, so it stays sharp at any size. Portrait screens get a separate layout.
- **Zoom transitions.** Clicking a component animates the SVG `viewBox` from the whole board down to that part, then the page expands out of it. Going back reverses it. Reduced-motion settings are respected.
- **No build step.** Plain HTML, CSS and JavaScript with no frameworks or dependencies, apart from the Archivo font from Google Fonts.

## Structure

```
index.html      page markup and the content of each page
css/style.css   styles, light and dark themes
js/main.js      board drawing, transitions, routing
```

## Running locally

Open `index.html` in a browser, or serve the folder:

```
python3 -m http.server 8000
```

## Status

Work in progress. Contact links, the CV PDF and project write-ups are placeholders for now.
