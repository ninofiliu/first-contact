import "@mediapipe/face_detection";
import "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-webgl";
import * as faceDetection from "@tensorflow-models/face-detection";
import * as handPoseDetection from "@tensorflow-models/hand-pose-detection";
import { Vector3 } from "three";

const getFlexion = (hand: handPoseDetection.Hand) => {
  if (!hand.keypoints3D) throw new Error("should detect 3D");

  const base = new Vector3(
    hand.keypoints3D[6].x - hand.keypoints3D[5].x,
    hand.keypoints3D[6].y - hand.keypoints3D[5].y,
    hand.keypoints3D[6].z! - hand.keypoints3D[5].z!
  ).normalize();

  const top = new Vector3(
    hand.keypoints3D[8].x - hand.keypoints3D[7].x,
    hand.keypoints3D[8].y - hand.keypoints3D[7].y,
    hand.keypoints3D[8].z! - hand.keypoints3D[7].z!
  ).normalize();

  return base.dot(top);
};

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

  const logger = document.createElement("pre");
  document.body.append(logger);
  const log = (str: string) => {
    logger.innerHTML = str;
  };

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
      const flexion = getFlexion(hand);
      log(flexion.toFixed(2));
    }

    requestAnimationFrame(loop);
  };
  loop();
};
