# Aeolus — the living wind

A live picture of the wind, temperature and rain across the world, drawn on a night globe from the current forecast.

**Open it: https://fechterj.github.io/aeolus/**

![Aeolus night globe with wind streamlines](og.jpg)

## What it does

- **Night globe.** Wind streamlines wrap a slowly turning Earth with coastlines and city lights. Drag to turn it, scroll or pinch to zoom, click any point for its weather.
- **Flat map.** The same wind over a dark basemap, for zooming in on a region.
- **Three layers.** Wind, temperature and rain, on their own or together.
- **Time.** Play up to three days of forecast forward, scrub with the slider, or jump back to now.
- **Silk.** A long-exposure mode where the wind paints itself into ribbons.
- **Cinema.** The interface disappears and the forecast plays. It keeps a frame every two forecast hours.
- **Capture and gallery.** Save the current sky as an image. Captures are kept in a gallery in your browser, on your device only.
- **Search.** Type a place to fly there.
- **Share.** The share button copies a link, or opens the share sheet on a phone, that opens this exact view: mode, place, zoom, layers, the forecast time if you chose one, and the point whose weather is open. The address bar keeps up as you move, so a reload keeps your place too.

## Controls

| Input | Action |
|---|---|
| Drag | Move the map or turn the globe |
| Scroll, pinch, `+` / `-` | Zoom |
| Double-click | Zoom in |
| Click | Wind, gusts, temperature, sky and a 24-hour outlook for that point |
| Arrow keys | Move the view (hold Shift for bigger steps) |
| `Enter` | Weather at the centre of the view |
| `Space` | Play or pause time |
| `G` | Globe or flat map |
| `S` | Silk |
| `C` | Cinema (any key or click returns) |
| `Esc` | Close the open panel or dialog |

## Running it yourself

There is no build step and no dependencies. The whole app is `index.html`, plus `land.geo.json` for the coastlines and `og.jpg` for link previews.

It needs to be served over HTTP, because the page loads `land.geo.json` by relative URL:

```bash
python3 -m http.server 8421 --bind 127.0.0.1
```

Then open http://127.0.0.1:8421/.

To host it, put the three files on any static host. The public copy is served by GitHub Pages from the `main` branch of this repository. If you host it somewhere else, change the `og:url` and `og:image` addresses near the top of `index.html`.

## Tests

Open `test.html` from the same server as the app, for example http://127.0.0.1:8421/test.html. It loads the real app in a frame at four screen sizes (two upright phones, a phone on its side, and a laptop) and checks what a person would notice: everything fits, nothing overlaps, phone controls are at least 44 px, touch drag and pinch work, the keyboard works, and dialogs handle focus. It also checks the map projections and the forecast cache rules.

The tests cost no forecast requests. The test page answers every frame's forecast requests itself, from one saved forecast: its own saved copy, else the app's cached forecast, else one real request that it keeps for next time, else a made-up forecast. The summary line says which it used and how many requests went to the forecast service (normally 0).

## Where the data comes from

Aeolus has no server and no account. Your browser talks directly to these services:

| Service | Used for |
|---|---|
| [Open-Meteo](https://open-meteo.com/) | Wind, temperature and rain forecasts; place search |
| [Esri](https://www.esri.com/) dark gray canvas | Basemap tiles on the flat map |
| [BigDataCloud](https://www.bigdatacloud.com/) | Turning a clicked point into a place name |
| [Natural Earth](https://www.naturalearthdata.com/) | Country outlines on the globe (public domain, shipped in this repo) |

Each of those services sees the request your browser makes to it, including your IP address and the area you are looking at. Aeolus itself collects nothing.

Things worth knowing:

- **Open-Meteo's free service has limits per connection** (per minute, per hour and per day), and every grid point counts as one call. Aeolus caches each forecast in your browser for 30 minutes so a reload costs nothing. If a limit is reached it says which one, waits, and keeps showing the last forecast it received.
- **Open-Meteo's free tier is offered for non-commercial use.** If you want to use Aeolus commercially, check their terms and use a paid plan.
- **The globe's wind grid is coarse.** It samples the world at 24 × 12 points, about every 15 degrees, so it shows the large patterns and smooths out small storms. The flat map samples the area on screen and is finer.

## Accessibility and performance

- Every control has a spoken name, dialogs manage focus, and the view can be moved with the keyboard.
- If your system asks for reduced motion, the wind is drawn as a still long-exposure picture and the globe does not turn.
- On a device that cannot keep up, Aeolus lowers its own quality in steps: glow off, then fewer particles, then fewer pixels.

## Licence

The code is released under the [MIT License](LICENSE).

That licence covers the code in this repository only. Forecast data, map tiles and place names come from the services above under their own terms, and their attributions must stay visible if you reuse this.
