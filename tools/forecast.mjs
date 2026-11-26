// Fetch the globe's forecast once and write it as forecast.json beside the app.
// Run hourly by .github/workflows/pages.yml, so visitors load the wind from this site instead of each
// asking Open-Meteo (some browsers' privacy settings stall requests to other sites).
//   node tools/forecast.mjs <out.json> [previous-forecast-url]
// If Open-Meteo fails, the previous published file is kept when it is still usable.
import { writeFile } from "node:fs/promises";

const [, , out = "forecast.json", previousUrl] = process.argv;
const COLS = 24, ROWS = 12, LAT_N = 84, LAT_S = -84;

const lats = [], lons = [];
for (let r = 0; r < ROWS; r++){
  const la = LAT_N - (LAT_N - LAT_S) * r / (ROWS - 1);
  for (let c = 0; c < COLS; c++){ lats.push(la.toFixed(2)); lons.push((-180 + 360 * c / COLS).toFixed(2)); }
}
const url = "https://api.open-meteo.com/v1/forecast"
  + "?latitude=" + lats.join(",") + "&longitude=" + lons.join(",")
  + "&hourly=wind_speed_10m,wind_direction_10m,temperature_2m,precipitation"
  + "&wind_speed_unit=ms&forecast_days=3&timezone=GMT&timeformat=unixtime";

/* compact form: one array per variable, hour-major ([h*n + j]), as whole numbers
   (speed and temperature in tenths, direction in degrees, rain in tenths of a mm) */
function compact(data){
  if (!Array.isArray(data) || data.length !== COLS * ROWS) throw new Error("expected " + COLS * ROWS + " places, got " + (data && data.length));
  const time = data[0].hourly && data[0].hourly.time;
  if (!Array.isArray(time) || time.length < 2) throw new Error("no hourly times");
  const n = data.length, nh = time.length;
  const sp = new Array(n * nh), di = new Array(n * nh), tp = new Array(n * nh), pr = new Array(n * nh);
  for (let j = 0; j < n; j++){
    const h = data[j].hourly;
    for (let k = 0; k < nh; k++){
      const i = k * n + j;
      sp[i] = Math.round((h.wind_speed_10m[k] ?? 0) * 10);
      di[i] = Math.round(h.wind_direction_10m[k] ?? 0);
      tp[i] = Math.round((h.temperature_2m[k] ?? 0) * 10);
      pr[i] = Math.round((h.precipitation[k] ?? 0) * 10);
    }
  }
  return { v: 1, at: Date.now(), cols: COLS, rows: ROWS, lon0: -180, latN: LAT_N, latS: LAT_S, t0: time[0], step: time[1] - time[0], nh, sp, di, tp, pr };
}

async function fresh(){
  let last;
  for (let attempt = 1; attempt <= 3; attempt++){
    try{
      const res = await fetch(url, { signal: AbortSignal.timeout(60000) });
      if (!res.ok) throw new Error("HTTP " + res.status);
      return compact(await res.json());
    }catch(e){ last = e; console.error("attempt " + attempt + ": " + e.message); await new Promise(r => setTimeout(r, 15000 * attempt)); }
  }
  throw last;
}

let body;
try{
  body = await fresh();
  console.log("forecast: " + body.nh + " hours from " + new Date(body.t0 * 1000).toISOString());
}catch(e){
  // keep what is published, as long as it still reaches into the future
  if (!previousUrl) throw e;
  const prev = await (await fetch(previousUrl, { signal: AbortSignal.timeout(30000) })).json();
  if (prev.v !== 1 || (prev.t0 + prev.step * (prev.nh - 1)) * 1000 < Date.now() + 6 * 3600e3) throw e;
  body = prev;
  console.log("Open-Meteo failed (" + e.message + "); kept the published forecast from " + new Date(prev.at).toISOString());
}
await writeFile(out, JSON.stringify(body));
