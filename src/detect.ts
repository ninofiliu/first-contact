import "@mediapipe/face_detection";
import "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-webgl";
import * as faceDetection from "@tensorflow-models/face-detection";
import * as handPoseDetection from "@tensorflow-models/hand-pose-detection";
import { Triangle, Vector3 } from "three";
import x from "./x";
import { DEBUG } from "./consts";

// 0 rightEye
// 1 leftEye
// 2 noseTip
// 3 mouthCenter
// 4 rightEarTragion
// 5 leftEarTragion

const FPS = 30;

type DetectedFace = {
  dir: "left" | "right" | "front";
  points: {
    x: number;
    y: number;
  }[];
};

type DetectedHand = {
  here: boolean;
  orientation: number;
  fingers: boolean[];
};

type Detected = {
  face: null | DetectedFace;
  left: DetectedHand;
  right: DetectedHand;
  nb: number;
};

const getDefaultDetectedHand = (): DetectedHand => ({
  here: false,
  orientation: 0,
  fingers: Array(5).fill(false),
});

export const detected: Detected = {
  face: null,
  left: getDefaultDetectedHand(),
  right: getDefaultDetectedHand(),
  nb: 0,
};

export const oldDetected: Detected = structuredClone(detected);

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
    canvas.style.transform = "scaleX(-1) translateY(100%)";
    canvas.style.position = "absolute";
    document.body.prepend(canvas);
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

    if (DEBUG) {
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

    Object.assign(oldDetected, structuredClone(detected));

    const left = hands.find((hand) => hand.handedness === "Right");
    detected.left = getDetectedHand(left);
    const right = hands.find((hand) => hand.handedness === "Left");
    detected.right = getDetectedHand(right);
    detected.nb =
      detected.left.fingers.filter((x) => x).length +
      detected.right.fingers.filter((x) => x).length;

    const [face] = faces;
    if (face) {
      const newPoints = face.keypoints.map(({ x, y }) => ({
        x: 1 - x / video.videoWidth,
        y: y / video.videoHeight,
      }));
      const orientation =
        (x(face.keypoints.find((x) => x.name === "noseTip")).x -
          face.box.xMin) /
        (face.box.xMax - face.box.xMin);
      detected.face = {
        dir: orientation > 0.7 ? "left" : orientation < 0.3 ? "right" : "front",
        points: oldDetected.face
          ? newPoints.map(({ x: newX, y: newY }, i) => {
              const SMOOTH = 0.2;
              const { x: oldX, y: oldY } = oldDetected.face!.points[i];
              return {
                x: SMOOTH * oldX + (1 - SMOOTH) * newX,
                y: SMOOTH * oldY + (1 - SMOOTH) * newY,
              };
            })
          : newPoints,
      };
    } else {
      detected.face = null;
    }

    setTimeout(loop, 1000 / FPS);
  };
  loop();
};
