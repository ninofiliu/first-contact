import "./styles.css";

import { randInt } from "three/src/math/MathUtils";

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

const cCanvas = document.createElement("canvas");
cCanvas.width = WIDTH;
cCanvas.height = HEIGHT;
document.body.append(cCanvas);
const c = x(cCanvas.getContext("2d"));

(async () => {
  const { faders, onPad } = await setupAkai([
    0.5, 0.5, 0.5, 0.5, 0, 0, 1, 0, 0,
  ]);
  const ids = await computeIds();
  const poly = createPoly();
  document.body.prepend(poly.canvas);
  const turbulenz = createTurbulenz(a, ids);
  const scratch = createScratch(b, ids);

  c.strokeStyle = "black";
  c.lineWidth = 5;
  c.fillStyle = "white";
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.font = `${0.3 * Math.min(WIDTH, HEIGHT)}px serif`;

  const state = {
    palette: "grey" as Parameters<typeof scratch>[0],
    symbols: false,
    stroke: false,
    invert: false,
  };

  const drawRandomSymbol = () => {
    c.clearRect(0, 0, WIDTH, HEIGHT);
    const txt = String.fromCodePoint(55348, randInt(56320, 56797));
    if (state.stroke) {
      c.strokeText(txt, WIDTH / 2, HEIGHT / 2);
    }
    c.fillText(txt, WIDTH / 2, HEIGHT / 2);
    a.drawImage(cCanvas, 0, 0);
  };

  onPad.add((x, y) => {
    console.log(`pad ${x} ${y}`);
    if (x === 1) {
      turbulenz.resetId();
    }
    if (x === 2) {
      if (y < 4) {
        state.palette = (["image", "grey", "poly", "red"] as const)[y];
      }
    }
    if (x === 3) {
      if (y === 0) state.symbols = !state.symbols;
      if (y === 1) drawRandomSymbol();
      if (y === 2) c.clearRect(0, 0, WIDTH, HEIGHT);
      if (y === 3) state.stroke = !state.stroke;
    }
    if (x === 7) {
      if (y === 0) state.invert = !state.invert;
    }
  });

  const tick = () => {
    poly.loop(faders[0] * faders[0] * 0.5, faders[4]);
    a.drawImage(poly.canvas, 0, 0);

    turbulenz.loop(faders[1]);

    scratch(state.palette, 1000, "rough");
    const r = 10 ** (3 * faders[2]);
    b.clearRect(
      Math.random() * WIDTH - r,
      Math.random() * HEIGHT - r,
      2 * r,
      2 * r
    );
    a.drawImage(bCanvas, 0, 0);

    if (state.symbols) drawRandomSymbol();

    poly.canvas.style.opacity = `${faders[5]}`;
    aCanvas.style.opacity = `${faders[6]}`;
    bCanvas.style.opacity = `${faders[7]}`;
    cCanvas.style.opacity = `${faders[8]}`;
    document.body.style.filter = `hue-rotate(${faders[3] * 0.5}turn) invert(${
      state.invert ? 1 : 0
    })`;

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
    console.log(`fps ${fps}`);
    fps = 0;
  }, 1000);
}
