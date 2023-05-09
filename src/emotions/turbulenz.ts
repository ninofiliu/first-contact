import { height, width } from "../consts";
import { detect } from "../detect";
import rPick from "../rPick";

export const createTurbulenz = (
  ctx: CanvasRenderingContext2D,
  ids: ImageData[]
) => {
  let map = rPick(ids);

  const resetId = () => {
    map = rPick(ids);
  };

  const loop = (nForce = 40 * detect.area) => {
    const force = 40 * nForce;
    const currentId = ctx.getImageData(0, 0, width, height);
    const nextId = new ImageData(width, height);
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const mapI = 4 * (width * y + x);
        const dx = force * (-0.5 + map.data[mapI] / 255);
        const dy = force * (-0.5 + map.data[mapI + 1] / 255);
        const mappedX = Math.round(x + dx + width) % width;
        const mappedY = Math.round(y + dy + height) % height;
        const mappedI = 4 * (width * mappedY + mappedX);
        for (let i = 0; i < 4; i++) {
          nextId.data[mapI + i] = currentId.data[mappedI + i];
        }
      }
    }
    ctx.putImageData(nextId, 0, 0);
  };

  return { resetId, loop };
};
