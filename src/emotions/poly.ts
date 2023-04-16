import { height, width } from "../consts";
import { Emotion } from "../types";
import x from "../x";
import fragmentSource from "./poly.frag?raw";
import vertexSource from "./poly.vert?raw";

const elt = document.createElement("div");
document.body.append(elt);
const title = document.createElement("h3");
title.innerHTML = "Poly";
elt.append(title);

const canvas = document.createElement("canvas");
elt.append(canvas);
canvas.width = width;
canvas.height = height;

const gl = x(canvas.getContext("webgl2"));

const createShader = (type: number, source: string) => {
  const shader = x(gl.createShader(type));
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
    throw new Error(`${gl.getShaderInfoLog(shader)}`);
  return shader;
};

const createProgram = () => {
  const vertexShader = createShader(gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentSource);

  const program = x(gl.createProgram());
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS))
    throw new Error(`${gl.getProgramInfoLog(program)}`);
  gl.useProgram(program);
  return program;
};

const program = createProgram();

const locations = {
  a_position: gl.getAttribLocation(program, "a_position"),
  u_time: gl.getUniformLocation(program, "u_time"),
};
gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
gl.enableVertexAttribArray(locations.a_position);
gl.vertexAttribPointer(locations.a_position, 2, gl.FLOAT, false, 0, 0);
gl.bufferData(
  gl.ARRAY_BUFFER,
  new Float32Array([-1, -1, -1, 1, 1, -1, 1, -1, -1, 1, 1, 1]),
  gl.STATIC_DRAW
);

let stopped = false;

const poly: Emotion = {
  start(masterCtx) {
    stopped = false;
    const loop = () => {
      if (stopped) return;
      gl.uniform1f(locations.u_time, performance.now() / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      masterCtx.drawImage(canvas, 0, 0);
      requestAnimationFrame(loop);
    };
    loop();
  },
  stop() {
    stopped = true;
  },
};

export default poly;
