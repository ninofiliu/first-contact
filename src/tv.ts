import { height, width } from "./consts";
import "./style.css";
import x from "./x";
import { detect, startDetecting } from "./detect";
import { createPoly } from "./emotions/poly";
import { createTurbulenz } from "./emotions/turbulenz";
import logFps from "./logFps";
import { createScratch } from "./emotions/scratch";
import { setupRecording } from "./record";
import { computeIds } from "./shorts";

const RECORD = false;

export const tv = async () => {
  logFps();
  const ids = await computeIds();
  await startDetecting();

  const canvas = document.createElement("canvas");
  document.body.prepend(canvas);
  canvas.width = width;
  canvas.height = height;
  const ctx = x(canvas.getContext("2d"));
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, width, height);

  const turbulenz = createTurbulenz(ctx, ids);
  const scratch = createScratch(ctx, ids);
  const poly = createPoly(ctx);

  if (RECORD) setupRecording(canvas);

  const loop = () => {
    if (detect.hasFace) {
      if (detect.hasHands) {
        scratch();
      } else {
        turbulenz();
      }
    } else {
      poly();
    }

    requestAnimationFrame(loop);
  };
  loop();
};
