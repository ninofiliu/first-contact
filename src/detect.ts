import { Triangle, Vector3 } from "three";
import { DEBUG, HEIGHT, WIDTH } from "./consts";

import {
  FaceDetector,
  FilesetResolver,
  HandLandmarker,
  NormalizedLandmark,
} from "@mediapipe/tasks-vision";

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

const getFingerFlexion = (hand: NormalizedLandmark[], index: number) => {
  const base = new Vector3(
    hand[4 * index + 2].x - hand[4 * index + 1].x,
    hand[4 * index + 2].y - hand[4 * index + 1].y,
    hand[4 * index + 2].z! - hand[4 * index + 1].z!,
  ).normalize();

  const top = new Vector3(
    hand[4 * index + 4].x - hand[4 * index + 3].x,
    hand[4 * index + 4].y - hand[4 * index + 3].y,
    hand[4 * index + 4].z! - hand[4 * index + 3].z!,
  ).normalize();

  return base.dot(top);
};

const getHandorientation = (hand: NormalizedLandmark[]) => {
  const triangle = new Triangle(
    new Vector3(hand[0].x, hand[0].y, hand[0].z),
    new Vector3(hand[17].x, hand[17].y, hand[17].z),
    new Vector3(hand[5].x, hand[5].y, hand[5].z),
  );
  const normal = new Vector3();
  triangle.getNormal(normal);
  return normal.z;
};

const getDetectedHand = (
  hand: NormalizedLandmark[] | undefined,
): DetectedHand =>
  hand
    ? {
        here: true,
        orientation: getHandorientation(hand),
        fingers: Array.from(
          { length: 5 },
          (_, i) => getFingerFlexion(hand, i) > 0.4,
        ),
      }
    : getDefaultDetectedHand();

export const startDetecting = async () => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  ctx.font = "48px serif";

  // hack to get the right cam in old computer
  // const infos = await navigator.mediaDevices.enumerateDevices();
  // const maybeExternalDeviceId = infos
  //   .filter((info) => info.kind === "videoinput")
  //   .find((info) => !/integrated/i.test(info.label))?.deviceId;
  // const stream = await navigator.mediaDevices.getUserMedia({
  //   video: { deviceId: maybeExternalDeviceId },
  // });
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });

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

  const vision = await FilesetResolver.forVisionTasks(
    "/pkgs/@mediapipe/tasks-vision/wasm",
  );
  const facedetector = await FaceDetector.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: "/blaze_face_short_range.tflite",
      delegate: "GPU",
    },
    runningMode: "VIDEO",
  });
  const handPoseDetector = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: "/hand_landmarker.task",
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    numHands: 2,
  });

  const loop = async () => {
    const facesD = await facedetector.detectForVideo(video, performance.now());
    const handsD = await handPoseDetector.detectForVideo(
      video,
      performance.now(),
    );

    if (DEBUG) {
      ctx.drawImage(video, 0, 0);

      for (const face of facesD.detections) {
        ctx.strokeStyle = "lime";
        ctx.strokeRect(
          face.boundingBox?.originX ?? 0,
          face.boundingBox?.originY ?? 0,
          face.boundingBox?.width ?? 0,
          face.boundingBox?.height ?? 0,
        );
        ctx.fillStyle = "aqua";
        for (let i = 0; i < face.keypoints.length; i++) {
          ctx.fillText(
            `${i}`,
            face.keypoints[i].x * WIDTH,
            face.keypoints[i].y * HEIGHT,
          );
        }
      }

      for (let i = 0; i < handsD.landmarks.length; i++) {
        const landmarks = handsD.landmarks[i];
        ctx.fillStyle = "red";
        for (const { x, y } of landmarks) {
          ctx.fillRect(x * WIDTH - 2, y * HEIGHT - 2, 5, 5);
        }
      }
    }

    Object.assign(oldDetected, structuredClone(detected));
    const hands = handsD.landmarks.map((landmarks, i) => ({
      landmarks,
      handedness: handsD.handedness[i],
    }));
    const left = hands.find((hand) =>
      hand.handedness.some((h) => h.categoryName == "Left" && h.score > 0.5),
    )?.landmarks;
    const right = hands.find((hand) =>
      hand.handedness.some((h) => h.categoryName == "Right" && h.score > 0.5),
    )?.landmarks;
    detected.left = getDetectedHand(left);
    detected.right = getDetectedHand(right);
    detected.nb =
      detected.left.fingers.filter((x) => x).length +
      detected.right.fingers.filter((x) => x).length;

    const [face] = facesD.detections;
    if (face) {
      const newPoints = face.keypoints.map(({ x, y }) => ({
        x: 1 - x / video.videoWidth,
        y: y / video.videoHeight,
      }));
      const orientation =
        (face.keypoints[2].x * WIDTH - (face.boundingBox?.originX ?? 0)) /
        (face.boundingBox?.width ?? 0);
      detected.face = {
        dir: orientation > 0.7 ? "left" : orientation < 0.3 ? "right" : "front",
        points: oldDetected.face
          ? newPoints.map(({ x: newX, y: newY }, i) => {
              const SMOOTH = 0.2;
              const { x: oldX, y: oldY } = oldDetected.face!.points[i];
              return {
                x: SMOOTH * oldX + (1 - SMOOTH) * newX * WIDTH,
                y: SMOOTH * oldY + (1 - SMOOTH) * newY * HEIGHT,
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
