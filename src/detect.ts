import "@mediapipe/face_detection";
import "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-webgl";
import * as faceDetection from "@tensorflow-models/face-detection";
import * as handPoseDetection from "@tensorflow-models/hand-pose-detection";
import { Vector3 } from "three";
import { DEBUG } from "./consts";
import x from "./x";

const FPS = 30;

export const detect = {
  hasFace: false,
  hasHands: false,
  area: 1,
  isClenched: false,
};

const getFingerFlexion = (hand: handPoseDetection.Hand, index: number) => {
  if (!hand.keypoints3D) throw new Error("should detect 3D");

  const base = new Vector3(
    hand.keypoints3D[4 * index + 2].x - hand.keypoints3D[4 * index + 1].x,
    hand.keypoints3D[4 * index + 2].y - hand.keypoints3D[4 * index + 1].y,
    hand.keypoints3D[4 * index + 2].z! - hand.keypoints3D[4 * index + 1].z!
  ).normalize();

  const top = new Vector3(
    hand.keypoints3D[4 * index + 4].x - hand.keypoints3D[4 * index + 3].x,
    hand.keypoints3D[4 * index + 4].y - hand.keypoints3D[4 * index + 3].y,
    hand.keypoints3D[4 * index + 4].z! - hand.keypoints3D[4 * index + 3].z!
  ).normalize();

  return base.dot(top);
};

export const startDetecting = async () => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  canvas.style.transform = "scaleX(-1)";
  if (DEBUG) {
    const debugElt = document.createElement("div");
    debugElt.style.display = "flex";
    const pre = document.createElement("pre");
    debugElt.append(canvas, pre);
    document.body.append(debugElt);
  }

  const infos = await navigator.mediaDevices.enumerateDevices();
  const maybeExternalDeviceId = infos
    .filter((info) => info.kind === "videoinput")
    .find((info) => !/integrated/i.test(info.label))?.deviceId;
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { deviceId: maybeExternalDeviceId },
  });
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
    const faces = await faceDetector.estimateFaces(video);
    const hands = await handPoseDetector.estimateHands(video);

    // debug
    {
      ctx.drawImage(video, 0, 0);

      for (const face of faces) {
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

      for (const hand of hands) {
        ctx.fillStyle = "red";
        for (const { x, y } of hand.keypoints) {
          ctx.fillRect(x - 2, y - 2, 5, 5);
        }
      }

      if (DEBUG) {
        x(document.querySelector("pre")).innerHTML = JSON.stringify(
          detect,
          null,
          2
        );
      }
    }

    // detect
    {
      const [face] = faces;
      const [hand] = hands;

      detect.hasFace = !!face;
      detect.hasHands = !!hand;
      detect.area = face
        ? (face.box.width * face.box.height) /
          (video.videoWidth * video.videoHeight)
        : 1;

      detect.isClenched = hand
        ? Array(5)
            .fill(null)
            .map((_, i) => getFingerFlexion(hand, i))
            .reduce((sum, val) => sum + val, 0) /
            5 <
          0
        : false;
    }

    setTimeout(loop, 1000 / FPS);
  };
  loop();
};
