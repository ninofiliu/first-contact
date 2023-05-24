import { HEIGHT, WIDTH } from "../consts";
import rPick from "../rPick";

export const createTurbulenz = (
  ctx: CanvasRenderingContext2D,
  ids: ImageData[]
) => {
  let map = rPick(ids);

  const resetId = () => {
    map = rPick(ids);
  };

  const loop = (nForce: number) => {
    const force = 40 * nForce;
    const currentId = ctx.getImageData(0, 0, WIDTH, HEIGHT);
    const nextId = new ImageData(WIDTH, HEIGHT);
    for (let x = 0; x < WIDTH; x++) {
      for (let y = 0; y < HEIGHT; y++) {
        const mapI = 4 * (WIDTH * y + x);
        const dx = force * (-0.5 + map.data[mapI] / 255);
        const dy = force * (-0.5 + map.data[mapI + 1] / 255);
        const mappedX = Math.round(x + dx + WIDTH) % WIDTH;
        const mappedY = Math.round(y + dy + HEIGHT) % HEIGHT;
        const mappedI = 4 * (WIDTH * mappedY + mappedX);
        for (let i = 0; i < 4; i++) {
          nextId.data[mapI + i] = currentId.data[mappedI + i];
        }
      }
    }
    ctx.putImageData(nextId, 0, 0);
  };

  return { resetId, loop };
};
