import { height, width } from "./consts";
import files from "./files";
import x from "./x";

/** For an image of dimensions (w,h) that has to fit in a container of dimensions (dw, dh), computes the cropped rectangle to be displayed and returns it as (sx, sy, sw, sh) */
const objectFitCover = (w: number, h: number, dw: number, dh: number) => {
  const [sw, sh] = w / h <= dw / dh ? [w, (w * dh) / dw] : [(h * dw) / dh, h];
  return [(w - sw) / 2, (h - sh) / 2, sw, sh] as const;
};

export const computeIds = async () => {
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
