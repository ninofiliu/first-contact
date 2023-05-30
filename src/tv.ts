import { HEIGHT, WIDTH } from "./consts";
import "./style.css";
import x from "./x";
import { detected, oldDetected, startDetecting } from "./detect";
import { createPoly } from "./emotions/poly";
import { createTurbulenz } from "./emotions/turbulenz";
import logFps from "./logFps";
import { createScratch } from "./emotions/scratch";
import { setupRecording } from "./record";
import { computeIds } from "./shorts";
import { clamp, mapLinear } from "three/src/math/MathUtils";

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
    if (detected.face.here) {
      if (detected.right.here) {
        const force = clamp(
          mapLinear(detected.right.orientation, 0.95, -1, 0, 1),
          0,
          1
        );
        turbulenz.loop(force);
        if (oldDetected.nb !== detected.nb) {
          turbulenz.resetId();
        }
      } else {
        if (detected.left.here) {
          scratch("poly", 1000);
        } else {
          scratch("grey", 250);
        }
      }
    } else {
      poly();
    }

    prettyDebug(ctx);
    requestAnimationFrame(loop);
    f++;
  };
  loop();
};
