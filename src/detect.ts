import "@mediapipe/face_detection";
import "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-webgl";
import * as faceDetection from "@tensorflow-models/face-detection";
import * as handPoseDetection from "@tensorflow-models/hand-pose-detection";
import { Triangle, Vector3 } from "three";
import { DEBUG } from "./consts";

const FPS = 30;

type DetectedFace = {
  here: boolean;
};

type DetectedHand = {
  here: boolean;
  orientation: number;
  fingers: boolean[];
};

type Detected = {
  face: DetectedFace;
  left: DetectedHand;
  right: DetectedHand;
  nb: number;
  nbJustChanged: boolean;
};

const getDefaultDetectedHand = (): DetectedHand => ({
  here: false,
  orientation: 0,
  fingers: Array(5).fill(false),
});

export const detected: Detected = {
  face: { here: false },
  left: getDefaultDetectedHand(),
  right: getDefaultDetectedHand(),
  nb: 0,
  nbJustChanged: false,
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

const getHandorientation = (hand: handPoseDetection.Hand) => {
  const triangle = new Triangle(
    new Vector3(
      hand.keypoints3D![0].x,
      hand.keypoints3D![0].y,
      hand.keypoints3D![0].z
    ),
    new Vector3(
      hand.keypoints3D![17].x,
      hand.keypoints3D![17].y,
      hand.keypoints3D![17].z
    ),
    new Vector3(
      hand.keypoints3D![5].x,
      hand.keypoints3D![5].y,
      hand.keypoints3D![5].z
    )
  );
  const normal = new Vector3();
  triangle.getNormal(normal);
  return normal.z;
};

const getDetectedHand = (
  hand: handPoseDetection.Hand | undefined
): DetectedHand =>
  hand
    ? {
        here: true,
        orientation: getHandorientation(hand),
        fingers: Array.from(
          { length: 5 },
          (_, i) => getFingerFlexion(hand, i) > 0.4
        ),
      }
    : getDefaultDetectedHand();

export const startDetecting = async () => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  canvas.style.transform = "scaleX(-1)";
  if (DEBUG) {
    const debugElt = document.createElement("div");
    debugElt.style.display = "flex";
    debugElt.style.alignItems = "flex-start";
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

  if (DEBUG) {
    document.body.append(canvas);
  }

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
    }

    // detect
    {
      const left = hands.find((hand) => hand.handedness === "Right");
      detected.left = getDetectedHand(left);
      const right = hands.find((hand) => hand.handedness === "Left");
      detected.right = getDetectedHand(right);
      const newNb =
        detected.left.fingers.filter((x) => x).length +
        detected.right.fingers.filter((x) => x).length;
      detected.nbJustChanged = newNb != detected.nb;
      detected.nb = newNb;
    }

    setTimeout(loop, 1000 / FPS);
  };
  loop();
};
