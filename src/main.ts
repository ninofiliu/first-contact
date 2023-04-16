import { height, width } from "./consts";
import poly from "./emotions/poly";
import "./style.css";
import x from "./x";

const masterCanvas = document.createElement("canvas");
document.body.prepend(masterCanvas);
masterCanvas.width = width;
masterCanvas.height = height;
const masterCtx = x(masterCanvas.getContext("2d"));

let stopped = true;
document.addEventListener("keydown", (evt) => {
  if (evt.key !== "a") return;
  console.log({ stopped });
  if (stopped) {
    poly.start(masterCtx);
  } else {
    poly.stop();
  }
  stopped = !stopped;
});
