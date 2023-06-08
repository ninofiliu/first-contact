import "./styles.css";

import { HEIGHT, WIDTH } from "../consts";
import { createPoly } from "../emotions/poly";
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

(async () => {
  const { faders, onPad } = await setupAkai([
    0.5, 0.5, 0, 0.5, 0.5, 0, 0, 1, 1,
  ]);
  const ids = await computeIds();
  const poly = createPoly();
  document.body.prepend(poly.canvas);
  const turbulenz = createTurbulenz(bg, ids);

  onPad.add((x, y) => {
    if (x === 1) {
      turbulenz.resetId();
    }
  });

  const tick = () => {
    poly.loop(faders[0] * 0.03, faders[3]);
    bg.drawImage(poly.canvas, 0, 0);
    turbulenz.loop(faders[1]);

    poly.canvas.style.opacity = `${faders[6]}`;
    bgCanvas.style.opacity = `${faders[7]}`;
    fgCanvas.style.opacity = `${faders[8]}`;

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
