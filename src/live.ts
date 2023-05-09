import { height, width } from "./consts";
import { createPoly } from "./emotions/poly";
import { createScratch } from "./emotions/scratch";
import { createTurbulenz } from "./emotions/turbulenz";
import { computeIds } from "./shorts";
import x from "./x";

const setupAkai = async () => {
  const faders = Array.from({ length: 9 }, () => 0);
  const onPad = new Set<(x: number, y: number) => void>();

  const access = await navigator.requestMIDIAccess();
  access.inputs.forEach((input) => {
    input.addEventListener("midimessage", (evt) => {
      const codes = {
        noteOff: 0x80,
        noteOn: 0x90,
        continuous: 0xb0,
      };
      const [a, b, c] = evt.data;
      if (a === codes.noteOn) {
        const x = b % 8;
        const y = b >> 3;
        for (const listener of onPad) listener(x, y);
      }
      if (a === codes.continuous) {
        faders[b - 48] = c / 127;
      }
    });
  });

  return { faders, onPad };
};

export const live = async () => {
  const akai = await setupAkai();
  const ids = await computeIds();

  akai.onPad.add((x, y) => console.log(x, y, ...akai.faders));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  document.body.append(canvas);
  const ctx = x(canvas.getContext("2d"));

  const poly = createPoly(ctx);
  const scratch = createScratch(ctx, ids);
  const turbulenz = createTurbulenz(ctx, ids);
  let emotion = "poly" as "poly" | "turbulenz" | "scratch";
  akai.onPad.add((x, y) => {
    if (x === 0 && y === 7) emotion = "poly";
    if (x === 1 && y === 7) emotion = "turbulenz";
    if (x === 2 && y === 7) emotion = "scratch";
  });

  const loop = () => {
    ({ poly, scratch, turbulenz })[emotion]();
    requestAnimationFrame(loop);
  };
  loop();
};
