import { height, width } from "./consts";
import { poly } from "./poly";
import files from "./files";
import "./style.css";
import x from "./x";

const rPick = <T>(arr: T[]): T => arr[~~(arr.length * Math.random())];

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
  const ids = await computeIds();

  const canvas = document.createElement("canvas");
  document.body.prepend(canvas);
  canvas.width = width;
  canvas.height = height;
  const ctx = x(canvas.getContext("2d"));

  ctx.putImageData(rPick(ids), 0, 0);
  const loop = () => {
    ctx.drawImage(poly.canvas, 0, 0);
    requestAnimationFrame(loop);
  };
  loop();
})();
