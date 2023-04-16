import x from "./x";

const force = 5;
const width = 640;
const height = 480;

export default async () => {
  const warpMapImg = document.createElement("img");
  warpMapImg.src = "/media/orange.jpg";
  await warpMapImg.decode();

  const warpedImageImg = document.createElement("img");
  warpedImageImg.src = "/media/pic.jpg";
  await warpedImageImg.decode();

  const canvas = document.createElement("canvas");
  document.body.append(canvas);
  canvas.width = width;
  canvas.height = height;
  const ctx = x(canvas.getContext("2d"));

  ctx.drawImage(
    warpMapImg,
    0,
    0,
    warpMapImg.width,
    warpMapImg.height,
    0,
    0,
    width,
    height
  );
  const warpMapImageData = ctx.getImageData(0, 0, width, height);

  ctx.drawImage(
    warpedImageImg,
    0,
    0,
    warpedImageImg.width,
    warpedImageImg.height,
    0,
    0,
    width,
    height
  );

  const loop = () => {
    const currentId = ctx.getImageData(0, 0, width, height);
    const nextId = new ImageData(width, height);
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const mapI = 4 * (width * y + x);
        const dx = force * (-0.5 + warpMapImageData.data[mapI] / 255);
        const dy = force * (-0.5 + warpMapImageData.data[mapI + 1] / 255);
        const mappedX = Math.round(x + dx + width) % width;
        const mappedY = Math.round(y + dy + height) % height;
        const mappedI = 4 * (width * mappedY + mappedX);
        for (let i = 0; i < 4; i++) {
          nextId.data[mapI + i] = currentId.data[mappedI + i];
        }
      }
    }
    ctx.putImageData(nextId, 0, 0);
    requestAnimationFrame(loop);
  };
  loop();
};
