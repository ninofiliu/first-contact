import "./styles.css";

import { HEIGHT, WIDTH } from "../consts";
import { createPoly } from "../emotions/poly";
import { createScratch } from "../emotions/scratch";
import { createTurbulenz } from "../emotions/turbulenz";
import { computeIds } from "../shorts";
import x from "../x";
import { setupAkai } from "./akai";

const aCanvas = document.createElement("canvas");
aCanvas.width = WIDTH;
aCanvas.height = HEIGHT;
document.body.append(aCanvas);
const a = x(aCanvas.getContext("2d"));

const bCanvas = document.createElement("canvas");
bCanvas.width = WIDTH;
bCanvas.height = HEIGHT;
document.body.append(bCanvas);
const b = x(bCanvas.getContext("2d"));

(async () => {
  const { faders, onPad } = await setupAkai([
    0.5, 0.5, 0, 0.5, 0.5, 0, 0, 1, 1,
  ]);
  const ids = await computeIds();
  const poly = createPoly();
  document.body.prepend(poly.canvas);
  const turbulenz = createTurbulenz(a, ids);
  const scratch = createScratch(b, ids);

  const state: {
    palette: Parameters<typeof scratch>[0];
  } = {
    palette: "grey",
  };

  onPad.add((x, y) => {
    console.log(x, y);
    if (x === 1) {
      turbulenz.resetId();
    }
    if (x === 2) {
      if (y < 4) {
        state.palette = (["image", "grey", "poly", "red"] as const)[y];
      }
    }
  });

  const tick = () => {
    poly.loop(faders[0] * 0.03, faders[3]);
    a.drawImage(poly.canvas, 0, 0);

    turbulenz.loop(faders[1]);

    scratch(state.palette, 500, "rough");
    const r = 10 ** (3 * faders[2]);
    b.clearRect(
      Math.random() * WIDTH - r,
      Math.random() * HEIGHT - r,
      2 * r,
      2 * r
    );
    a.drawImage(bCanvas, 0, 0);

    poly.canvas.style.opacity = `${faders[6]}`;
    aCanvas.style.opacity = `${faders[7]}`;
    bCanvas.style.opacity = `${faders[8]}`;

    requestAnimationFrame(tick);
  };
  tick();
})();

{
  let fps = 0;
  const loop = () => {
    fps++;
    requestAnimationFrame(loop);
  };
  loop();
  setInterval(() => {
    document.title = `${fps}`;
    fps = 0;
  }, 1000);
}
