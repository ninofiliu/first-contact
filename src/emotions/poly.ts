import { HEIGHT, WIDTH } from "../consts";
import x from "../x";
import fragmentSource from "./poly.frag?raw";
import vertexSource from "./poly.vert?raw";

const canvas = document.createElement("canvas");
canvas.width = WIDTH;
canvas.height = HEIGHT;

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
  u_threshold: gl.getUniformLocation(program, "u_threshold"),
};
gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
gl.enableVertexAttribArray(locations.a_position);
gl.vertexAttribPointer(locations.a_position, 2, gl.FLOAT, false, 0, 0);
gl.bufferData(
  gl.ARRAY_BUFFER,
  new Float32Array([-1, -1, -1, 1, 1, -1, 1, -1, -1, 1, 1, 1]),
  gl.STATIC_DRAW
);

let time = 0;

export const createPoly = () => ({
  canvas,
  gl,
  loop: (speed: number, threshold: number) => {
    gl.uniform1f(locations.u_threshold, threshold);
    gl.uniform1f(locations.u_time, (time += speed));
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  },
});
