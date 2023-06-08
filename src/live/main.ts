import "./styles.css";

import { HEIGHT, WIDTH } from "../consts";
import { createPoly } from "../emotions/poly";
import { createScratch } from "../emotions/scratch";
import { createTurbulenz } from "../emotions/turbulenz";
import { computeIds } from "../shorts";
import x from "../x";
import { setupAkai } from "./akai";

const bgCanvas = document.createElement("canvas");
bgCanvas.width = WIDTH;
bgCanvas.height = HEIGHT;
document.body.append(bgCanvas);
const bg = x(bgCanvas.getContext("2d"));

const fgCanvas = document.createElement("canvas");
fgCanvas.width = WIDTH;
fgCanvas.height = HEIGHT;
document.body.append(fgCanvas);
const fg = x(fgCanvas.getContext("2d"));

const state = {
  emotion: "poly" as "poly" | "turbulenz" | "scratch",
};

(async () => {
  const { faders, onPad } = await setupAkai([0, 0, 0, 0, 0, 0, 0, 1, 1]);
  const ids = await computeIds();
  const turbulenz = createTurbulenz(bg, ids);
  const poly = createPoly(bg);
  const scratch = createScratch(bg, ids);

  onPad.add((x) => {
    const map = ["turbulenz", "poly", "scratch"] as const;
    if (x in map) {
      state.emotion = map[x];
    }
  });

  const tick = () => {
    if (state.emotion === "poly") poly();
    if (state.emotion === "scratch") scratch("red", 500, "rough");
    if (state.emotion === "turbulenz") turbulenz.loop(0.2);
    bgCanvas.style.opacity = `${faders[7]}`;
    fgCanvas.style.opacity = `${faders[8]}`;
    requestAnimationFrame(tick);
  };
  tick();
})();
