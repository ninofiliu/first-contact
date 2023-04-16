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
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  const settings = stream.getVideoTracks()[0].getSettings();
  const width = x(settings.width);
  const height = x(settings.height);
  const video = document.createElement("video");
  video.srcObject = stream;
  video.autoplay = true;

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

  const encoder = new VideoEncoder({
    error: console.error,
    output: (() => {
      let lastChunk: EncodedVideoChunk;
      let moshing = false;
      document.addEventListener("keydown", (evt) => {
        if (evt.key !== " ") return;
        moshing = true;
      });
      document.addEventListener("keyup", (evt) => {
        if (evt.key !== " ") return;
        moshing = false;
      });
      return (chunk) => {
        if (moshing) {
          decoder.decode(lastChunk || chunk);
        } else {
          decoder.decode(chunk);
          lastChunk = chunk;
        }
      };
    })(),
  });
  encoder.configure({ codec: "vp8", width, height });

  const loop = () => {
    inCtx.drawImage(video, 0, 0);
    const frame = new VideoFrame(inCanvas, { timestamp: performance.now() });
    encoder.encode(frame);
    frame.close();
    requestAnimationFrame(loop);
  };
  loop();
};
