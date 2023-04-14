import "@mediapipe/face_detection";
import "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-webgl";
import * as faceDetection from "@tensorflow-models/face-detection";
import * as handPoseDetection from "@tensorflow-models/hand-pose-detection";

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

  const faceDetector = await faceDetection.createDetector(
    faceDetection.SupportedModels.MediaPipeFaceDetector,
    {
      runtime: "mediapipe",
      solutionPath: "/pkgs/@mediapipe/face_detection",
      maxFaces: 1,
    }
  );
  const handPoseDetector = await handPoseDetection.createDetector(
    handPoseDetection.SupportedModels.MediaPipeHands,
    {
      runtime: "mediapipe",
      solutionPath: "/pkgs/@mediapipe/hands",
      modelType: "full",
    }
  );

  const loop = async () => {
    ctx.drawImage(video, 0, 0);

    for (const face of await faceDetector.estimateFaces(video)) {
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

    for (const hand of await handPoseDetector.estimateHands(video)) {
      ctx.fillStyle = "red";
      for (const { x, y } of hand.keypoints) {
        ctx.fillRect(x - 2, y - 2, 5, 5);
      }
    }

    requestAnimationFrame(loop);
  };
  loop();
};
