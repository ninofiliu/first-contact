import "./styles.css";

import { HEIGHT, WIDTH } from "../consts";
import { setupAkai } from "./akai";

const bgCanvas = document.createElement("canvas");
bgCanvas.width = WIDTH;
bgCanvas.height = HEIGHT;
document.body.append(bgCanvas);
// const bg = x(bgCanvas.getContext("2d"));

const fgCanvas = document.createElement("canvas");
fgCanvas.width = WIDTH;
fgCanvas.height = HEIGHT;
document.body.append(fgCanvas);
// const fg = x(fgCanvas.getContext("2d"));

(async () => {
  const { faders } = await setupAkai();

  const tick = () => {
    bgCanvas.style.opacity = `${faders[7]}`;
    fgCanvas.style.opacity = `${faders[8]}`;
    requestAnimationFrame(tick);
  };
  tick();
})();
