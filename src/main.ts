import { height, width } from "./consts";
import files from "./files";
import "./style.css";
import x from "./x";
import { createDetect } from "./detect";
import poly from "./emotions/poly";
import { createTurbulenz } from "./emotions/turbulenz";
import logFps from "./logFps";
import scratch from "./emotions/scratch";

/** For an image of dimensions (w,h) that has to fit in a container of dimensions (dw, dh), computes the cropped rectangle to be displayed and returns it as (sx, sy, sw, sh) */
const objectFitCover = (w: number, h: number, dw: number, dh: number) => {
  const [sw, sh] = w / h <= dw / dh ? [w, (w * dh) / dw] : [(h * dw) / dh, h];
  return [(w - sw) / 2, (h - sh) / 2, sw, sh] as const;
};

const computeIds = async () => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = x(canvas.getContext("2d"));

  return Promise.all(
    files.map(async (src) => {
      const img = document.createElement("img");
      img.src = src;
      await img.decode();
      ctx.drawImage(
        img,
        ...objectFitCover(img.width, img.height, width, height),
        0,
        0,
        width,
        height
      );
      return ctx.getImageData(0, 0, width, height);
    })
  );
};

(async () => {
  logFps();
  const ids = await computeIds();
  const detect = await createDetect();
  const turbulenz = createTurbulenz(ids);

  const canvas = document.createElement("canvas");
  document.body.prepend(canvas);
  canvas.width = width;
  canvas.height = height;
  const ctx = x(canvas.getContext("2d"));
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, width, height);

  const loop = () => {
    if (detect.hasHands) {
      scratch(ctx, ids);
    } else if (detect.hasFace) {
      turbulenz(ctx);
    } else {
      poly(ctx);
    }
    requestAnimationFrame(loop);
  };
  loop();
})();
