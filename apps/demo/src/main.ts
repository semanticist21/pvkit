import { type EstimateInput, estimate } from "./estimate.ts";

const form = document.getElementById("f") as HTMLFormElement;
const out = document.getElementById("out") as HTMLElement;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmt = (n: number) => Math.round(n).toLocaleString();

const render = () => {
  if (!form.checkValidity()) return;
  const v = (name: string) => Number((form.elements.namedItem(name) as HTMLInputElement).value);
  const input: EstimateInput = {
    latitude: v("latitude"),
    longitude: v("longitude"),
    altitude: v("altitude"),
    tilt: v("tilt"),
    azimuth: v("azimuth"),
    dcKw: v("dcKw"),
    losses: v("losses") / 100,
    linkeTurbidity: v("linkeTurbidity"),
    tempAir: v("tempAir"),
  };
  const t0 = performance.now();
  const r = estimate(input);
  const ms = performance.now() - t0;
  const max = Math.max(...r.monthlyKwh);
  const bars = r.monthlyKwh
    .map(
      (k, i) =>
        `<div style="height:${(k / max) * 100}%" title="${MONTHS[i]}: ${fmt(k)} kWh"></div>`,
    )
    .join("");
  const rows = r.monthlyKwh
    .map((k, i) => `<tr><th>${MONTHS[i]}</th><td>${fmt(k)} kWh</td></tr>`)
    .join("");
  out.innerHTML = `
    <div class="hero">${fmt(r.annualKwh)} kWh/yr</div>
    <div class="sub">${fmt(r.specificYield)} kWh/kWp · 8,760 hourly steps in ${fmt(ms)} ms</div>
    <div id="chart" role="img" aria-label="Monthly AC energy, kWh">${bars}</div>
    <div id="months">${MONTHS.map((m) => `<span>${m}</span>`).join("")}</div>
    <details><summary>Monthly table</summary><table>${rows}</table></details>`;
};

form.addEventListener("change", render);
document.getElementById("locate")?.addEventListener("click", () => {
  navigator.geolocation.getCurrentPosition(({ coords }) => {
    (form.elements.namedItem("latitude") as HTMLInputElement).value = coords.latitude.toFixed(4);
    (form.elements.namedItem("longitude") as HTMLInputElement).value = coords.longitude.toFixed(4);
    if (coords.altitude != null) {
      (form.elements.namedItem("altitude") as HTMLInputElement).value = coords.altitude.toFixed(0);
    }
    render();
  });
});
render();
