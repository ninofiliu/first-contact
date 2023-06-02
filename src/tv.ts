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

export const tv = async () => {
  logFps();
  const ids = await computeIds();
  await startDetecting();

  const canvas = document.createElement("canvas");
  canvas.style.position = "absolute";
  document.body.append(canvas);

  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = x(canvas.getContext("2d"));
  ctx.fillStyle = "black";
  ctx.strokeStyle = "red";
  ctx.lineWidth = 1;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const overlayCanvas = document.createElement("canvas");
  overlayCanvas.style.position = "absolute";
  overlayCanvas.style.filter =
    "drop-shadow(0 0 3px black) drop-shadow(0 0 6px grey)";
  overlayCanvas.width = WIDTH;
  overlayCanvas.height = HEIGHT;
  document.body.append(overlayCanvas);

  const overlay = x(overlayCanvas.getContext("2d"));
  overlay.strokeStyle = "white";
  overlay.lineWidth = 5;

  const turbulenz = createTurbulenz(ctx, ids);
  const scratch = createScratch(ctx, ids);
  const poly = createPoly(ctx);

  if (RECORD) setupRecording(canvas);

  let f = 0;
  const loop = () => {
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

      if (detected.left.here && detected.nb !== oldDetected.nb) {
        poly();
      }
    } else {
      if (detected.left.here) {
        // TODO
        scratch("grey", 1000);
      } else {
        if (detected.face) {
          turbulenz.loop(0.2);
        } else {
          poly();
        }
      }
    }

    {
      const FINGER_SIZE = 0.2;
      const X_SHIFT = 20;
      overlay.clearRect(0, 0, WIDTH, HEIGHT);
      const s = HEIGHT / 6;

      const star = (x: number, y: number) => {
        const xMin = x - s * FINGER_SIZE;
        const xMax = x + s * FINGER_SIZE;
        const yMin = y - s * FINGER_SIZE;
        const yMax = y + s * FINGER_SIZE;

        overlay.beginPath();
        overlay.moveTo(xMin, y);
        overlay.arcTo(x, y, x, yMin, s * FINGER_SIZE);
        overlay.arcTo(x, y, xMax, y, s * FINGER_SIZE);
        overlay.arcTo(x, y, x, yMax, s * FINGER_SIZE);
        overlay.arcTo(x, y, xMin, y, s * FINGER_SIZE);
        overlay.arcTo(x, y, x, yMin, s * FINGER_SIZE);
        overlay.stroke();
      };

      for (const { hand, xStart, xShift } of [
        { hand: detected.left, xStart: s, xShift: X_SHIFT },
        { hand: detected.right, xStart: WIDTH - s, xShift: -X_SHIFT },
      ]) {
        if (hand.here) {
          for (let i = 0; i < 5; i++) {
            if (hand.fingers[i]) {
              star(xStart + i * xShift, (i + 1) * s);
            }
          }
        }
      }
      if (detected.face) {
        const ps = detected.face!.points.map(({ x, y }) => ({
          x: x * WIDTH,
          y: y * HEIGHT,
        }));

        ctx.fillStyle = ["red", "purple"][~~(f / 5) % 2];
        for (const { x, y } of ps) {
          ctx.fillRect(x - 2, y - 2, 5, 5);
        }
      }
    }

    requestAnimationFrame(loop);
    f++;
  };
  loop();
};
