import { height, width } from "./consts";
import files from "./files";
import "./style.css";
import x from "./x";
import { createDetect } from "./detect";

// const rPick = <T>(arr: T[]): T => arr[~~(arr.length * Math.random())];

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
  const detect = await createDetect();

  const canvas = document.createElement("canvas");
  document.body.prepend(canvas);
  canvas.width = width;
  canvas.height = height;
  const ctx = x(canvas.getContext("2d"));
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, width, height);

  // const turbulenz = createTurbulenz(ctx, ids);
  // const { hasFace, getClench } = await detect();

  // let emotion: "poly" | "turbulenz" = "poly";
  // document.addEventListener("keypress", (evt) => {
  //   if (evt.key === "p") emotion = "poly";
  //   if (evt.key === "t") emotion = "turbulenz";
  // });

  // let i = 0;
  // let clench: number;
  // let face: boolean;
  // const loop = async () => {
  //   if (i % 10 === 0) {
  //     clench = await getClench();
  //     face = await hasFace();
  //   }
  //   if (clench < -0.25 && i % 5 === 0) turbulenz.updateMap();
  //   emotion = face ? "turbulenz" : "poly";

  //   if (emotion === "turbulenz" && Math.random() > 0.005) {
  //     turbulenz.loop();
  //   } else {
  //     ctx.drawImage(poly.canvas, 0, 0);
  //   }
  //   requestAnimationFrame(loop);
  //   i++;
  // };
  // loop();
})();
