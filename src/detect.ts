import "@mediapipe/face_detection";
import "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-webgl";
import * as faceDetection from "@tensorflow-models/face-detection";

export default async () => {
  const canvas = document.createElement("canvas");
  document.body.append(canvas);
  const ctx = canvas.getContext("2d")!;
  canvas.style.transform = "scaleX(-1)";

  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  const video = document.createElement("video");
  video.srcObject = stream;
  await video.play();
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const detector = await faceDetection.createDetector(
    faceDetection.SupportedModels.MediaPipeFaceDetector,
    {
      runtime: "mediapipe",
      solutionPath: "/pkgs/@mediapipe/face_detection",
    }
  );

  const loop = async () => {
    ctx.drawImage(video, 0, 0);
    for (const face of await detector.estimateFaces(video)) {
      ctx.strokeStyle = "lime";
      ctx.strokeRect(
        face.box.xMin,
        face.box.yMin,
        face.box.width,
        face.box.height
      );
      ctx.fillStyle = "aqua";
      for (const { x, y } of face.keypoints) {
        ctx.fillRect(x - 2, y - 2, 5, 5);
      }
    }
    requestAnimationFrame(loop);
  };
  loop();
};
