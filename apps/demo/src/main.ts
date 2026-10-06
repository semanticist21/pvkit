import { type EstimateInput, estimate } from "./estimate.ts";
import { codeFor, readQuery } from "./share.ts";

const form = document.getElementById("f") as HTMLFormElement;
const out = document.getElementById("out") as HTMLElement;
const share = document.getElementById("share") as HTMLInputElement;
const code = document.getElementById("code") as HTMLElement;
const inputs = [...form.querySelectorAll("input")];
for (const [name, value] of Object.entries(readQuery(location.search, inputs))) {
  (form.elements.namedItem(name) as HTMLInputElement).value = value;
}
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmt = (n: number) => Math.round(n).toLocaleString();

const render = () => {
  if (!form.reportValidity()) {
    out.textContent = "Fix the highlighted field to update the estimate.";
    return;
  }
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
  const query = new URLSearchParams(inputs.map((i) => [i.name, i.value]));
  history.replaceState(null, "", `?${query}`);
  share.value = location.href;
  code.textContent = codeFor(input);
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
  // Altitude stays as entered: coords.altitude is height above the WGS84 ellipsoid, not sea level.
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      (form.elements.namedItem("latitude") as HTMLInputElement).value = coords.latitude.toFixed(4);
      (form.elements.namedItem("longitude") as HTMLInputElement).value =
        coords.longitude.toFixed(4);
      render();
    },
    (err) => {
      out.textContent = `Could not get your location (${err.message}). Enter it by hand.`;
    },
  );
});
// Copy via the clipboard API; without it (or if denied), select the text for a manual copy.
for (const button of document.querySelectorAll<HTMLButtonElement>("[data-copy]")) {
  const label = button.textContent;
  button.addEventListener("click", async () => {
    const target = document.getElementById(button.dataset.copy ?? "") as HTMLElement;
    const text = target instanceof HTMLInputElement ? target.value : (target.textContent ?? "");
    try {
      await navigator.clipboard.writeText(text);
      button.textContent = "Copied";
    } catch {
      if (target instanceof HTMLInputElement) target.select();
      else getSelection()?.selectAllChildren(target);
      button.textContent = "Selected — press Ctrl/⌘+C";
    }
    setTimeout(() => {
      button.textContent = label;
    }, 2000);
  });
}
render();
