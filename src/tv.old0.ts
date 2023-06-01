// @ts-nocheck
import { HEIGHT, WIDTH } from "./consts";
import "./style.css";
import x from "./x";
import { detected, startDetecting } from "./detect";
import { createPoly } from "./emotions/poly";
import { createTurbulenz } from "./emotions/turbulenz";
import logFps from "./logFps";
import { createScratch } from "./emotions/scratch";
import { setupRecording } from "./record";
import { computeIds } from "./shorts";
import { mapLinear } from "three/src/math/MathUtils";

const RECORD = false;

const prettyDebug = (ctx: CanvasRenderingContext2D) => {
  const s = HEIGHT / 6;
  ctx.fillStyle = "red";
  for (const { hand, x } of [
    { hand: detected.left, x: s },
    { hand: detected.right, x: WIDTH - s },
  ]) {
    if (hand.here) {
      for (let i = 0; i < 5; i++) {
        if (hand.fingers[i]) {
          ctx.fillRect(x, (i + 1) * s, s * 0.3, s * 0.3);
        }
      }
    }
  }
};

export const tv = async () => {
  logFps();
  const ids = await computeIds();
  await startDetecting();

  const canvas = document.createElement("canvas");
  document.body.prepend(canvas);
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = x(canvas.getContext("2d"));
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const turbulenz = createTurbulenz(ctx, ids);
  const scratch = createScratch(ctx, ids);
  const poly = createPoly(ctx);

  if (RECORD) setupRecording(canvas);

  let f = 0;
  const loop = () => {
    if (detected.right.here) {
      const val = mapLinear(
        detected.right.orientation,
        -Math.PI / 2,
        Math.PI / 2,
        0,
        1
      );
      turbulenz.loop(val * 0.5);
      ctx.canvas.style.filter = `hue-rotate(${(1 - val) * 0.2}turn)`;
      if (detected.left.here) {
        const nb = detected.left.fingers.filter((x) => x).length;
        if (nb === 0) {
          poly();
        } else {
          if (f % [1, 4, 16, 64, 256][nb] === 0) turbulenz.resetId();
        }
      }
    } else {
      if (detected.left.here) {
        scratch();
      } else {
        poly();
      }
    }
    prettyDebug(ctx);
    requestAnimationFrame(loop);
    f++;
  };
  loop();
};
