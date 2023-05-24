import { HEIGHT, WIDTH } from "../consts";
import rPick from "../rPick";

const curviness = 21;
const correctness = 21;
const posterize = 5;
const stopAt = 0.2;

const hex = (r: number, g: number, b: number) =>
  `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;

const computePalette = (id: ImageData, nb: number) => {
  const length = id.width * id.height;
  const sortedBySum = Array(length)
    .fill(null)
    .map((_, i) => ({
      r: id.data[4 * i],
      g: id.data[4 * i + 1],
      b: id.data[4 * i + 2],
    }))
    .sort((a, b) => a.r + a.g + a.b - (b.r + b.g + b.b));
  return Array(nb)
    .fill(null)
    .map((_, i) => sortedBySum[Math.floor((length / nb) * (i + 0.5))])
    .map(({ r, g, b }) => hex(r, g, b));
};

const stopFn = (light: number, i: number) =>
  ((Math.floor(light * posterize) / posterize) * curviness) % 1 <
  i / correctness;

const createMatrix = <T>(fn: (x: number, y: number) => T) =>
  new Array(WIDTH)
    .fill(null)
    .map((_, x) => new Array(HEIGHT).fill(null).map((__, y) => fn(x, y)));

let done = false;

const createLoop = (ctx: CanvasRenderingContext2D, id: ImageData) => {
  const palettes = {
    image: computePalette(id, 8),
    red: ["#000", "#000", "#800", "#800", "#f00", "#f00", "#fff", "#fff"],
  };

  const srcR = createMatrix((x, y) => id.data[4 * (WIDTH * y + x)] / 256);
  const srcG = createMatrix((x, y) => id.data[4 * (WIDTH * y + x) + 1] / 256);
  const srcB = createMatrix((x, y) => id.data[4 * (WIDTH * y + x) + 2] / 256);
  const drawnR = createMatrix(() => false);
  const drawnG = createMatrix(() => false);
  const drawnB = createMatrix(() => false);

  const posR = { x: Math.floor(WIDTH / 2), y: Math.floor(HEIGHT / 2) };
  const posG = { x: Math.floor(WIDTH / 2), y: Math.floor(HEIGHT / 2) };
  const posB = { x: Math.floor(WIDTH / 2), y: Math.floor(HEIGHT / 2) };

  const draw = () => {
    // const palette = detected.isClenched ? palettes.red : palettes.image;
    const palette = false ? palettes.red : palettes.image;
    drawnR[posR.x][posR.y] = true;
    ctx.fillStyle =
      palette[
        (drawnR[posR.x][posR.y] ? 4 : 0) +
          (drawnG[posR.x][posR.y] ? 2 : 0) +
          (drawnB[posR.x][posR.y] ? 1 : 0)
      ];
    ctx.fillRect(posR.x, posR.y, 1, 1);

    drawnG[posG.x][posG.y] = true;
    ctx.fillStyle =
      palette[
        (drawnR[posG.x][posG.y] ? 4 : 0) +
          (drawnG[posG.x][posG.y] ? 2 : 0) +
          (drawnB[posG.x][posG.y] ? 1 : 0)
      ];
    ctx.fillRect(posG.x, posG.y, 1, 1);

    drawnB[posB.x][posB.y] = true;
    ctx.fillStyle =
      palette[
        (drawnR[posB.x][posB.y] ? 4 : 0) +
          (drawnG[posB.x][posB.y] ? 2 : 0) +
          (drawnB[posB.x][posB.y] ? 1 : 0)
      ];
    ctx.fillRect(posB.x, posB.y, 1, 1);
  };

  const isInCanvas = ({ x, y }: { x: number; y: number }) =>
    x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT;

  function* spiralPositions(pos: { x: number; y: number }) {
    const spiralPosition = { ...pos };
    for (let l = 1; l < Math.max(WIDTH, HEIGHT); l += 2) {
      for (let i = 0; i < l; i++) {
        spiralPosition.x++;
        if (isInCanvas(spiralPosition)) yield spiralPosition;
      }
      for (let i = 0; i < l; i++) {
        spiralPosition.y++;
        if (isInCanvas(spiralPosition)) yield spiralPosition;
      }
      for (let i = 0; i < l + 1; i++) {
        spiralPosition.x--;
        if (isInCanvas(spiralPosition)) yield spiralPosition;
      }
      for (let i = 0; i < l + 1; i++) {
        spiralPosition.y--;
        if (isInCanvas(spiralPosition)) yield spiralPosition;
      }
    }
    done = true;
  }

  const moveColor = (
    drawn: boolean[][],
    pos: { x: number; y: number },
    src: number[][]
  ) => {
    let i = 0;
    for (const spiralPosition of spiralPositions(pos)) {
      i++;
      const { x, y } = spiralPosition;
      if (!drawn[x][y]) {
        if (stopFn(src[x][y], i)) {
          pos.x = spiralPosition.x;
          pos.y = spiralPosition.y;
          return;
        }
      }
    }
  };
  const move = () => {
    moveColor(drawnR, posR, srcR);
    moveColor(drawnG, posG, srcG);
    moveColor(drawnB, posB, srcB);
  };

  let nbDrawn = 0;

  done = false;
  return () => {
    if (nbDrawn > WIDTH * HEIGHT * stopAt) {
      done = true;
      return;
    }
    // const batch = detected.isClenched ? 5000 : 100;
    const batch = 1000;
    for (let i = 0; i < batch; i++) {
      if (done) return;
      move();
      draw();
      nbDrawn++;
    }
  };
};

let loop: () => void;
done = true;
export const createScratch =
  (ctx: CanvasRenderingContext2D, ids: ImageData[]) => () => {
    if (done) loop = createLoop(ctx, rPick(ids));
    loop();
  };
