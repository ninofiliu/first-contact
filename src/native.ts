import log from "./log";
import x from "./x";

{
  let fps = 0;
  setInterval(() => {
    log({ fps });
    fps = 0;
  }, 1_000);
  const loop = () => {
    fps++;
    requestAnimationFrame(loop);
  };
  loop();
}

export default async () => {
  const img = document.createElement("img");
  img.src = "/media/pic.jpg";
  await new Promise((r) => img.addEventListener("load", r, { once: true }));

  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  const settings = stream.getVideoTracks()[0].getSettings();
  const width = x(settings.width);
  const height = x(settings.height);
  const video = document.createElement("video");
  video.srcObject = stream;
  video.autoplay = true;

  const prevCanvas = document.createElement("canvas");
  prevCanvas.width = width;
  prevCanvas.height = height;
  const prevCtx = x(prevCanvas.getContext("2d"));

  const inCanvas = document.createElement("canvas");
  inCanvas.width = width;
  inCanvas.height = height;
  const inCtx = x(inCanvas.getContext("2d"));

  const outCanvas = document.createElement("canvas");
  outCanvas.width = width;
  outCanvas.height = height;
  const outCtx = x(outCanvas.getContext("2d"));

  document.body.append(outCanvas);
  outCanvas.style.transform = "scaleX(-1)";

  const decoder = new VideoDecoder({
    error: console.error,
    output: (frame) => {
      outCtx.drawImage(frame, 0, 0);
      frame.close();
    },
  });
  decoder.configure({ codec: "vp8" });

  let prevDecoded = false;
  const prevEncoder = new VideoEncoder({
    error: console.error,
    output: (chunk) => {
      decoder.decode(chunk);
      prevDecoded = true;
    },
  });
  prevEncoder.configure({ codec: "vp8", width, height });

  const inEncoder = new VideoEncoder({
    error: console.error,
    output: (chunk) => {
      if (chunk.type === "key" || !prevDecoded) return;
      decoder.decode(chunk);
    },
  });
  inEncoder.configure({ codec: "vp8", width, height });

  prevCtx.drawImage(img, 0, 0, img.width, img.height, 0, 0, width, height);
  const prevFrame = new VideoFrame(prevCanvas, {
    timestamp: performance.now(),
  });
  prevEncoder.encode(prevFrame);
  prevFrame.close();

  const loop = () => {
    inCtx.drawImage(video, 0, 0);
    const frame = new VideoFrame(inCanvas, { timestamp: performance.now() });
    inEncoder.encode(frame);
    frame.close();
    requestAnimationFrame(loop);
  };
  loop();
};
