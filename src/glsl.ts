import fragmentSource from "./fragment.glsl?raw";
import vertexSource from "./vertex.glsl?raw";

const exists = <T>(x: T | null | undefined): T => {
  if (x === null || x === undefined) throw new Error("should not be nullish");
  return x;
};

document.body.style.margin = "0";
document.body.style.overflow = "hidden";

const width = window.innerWidth;
const height = window.innerHeight;
const canvas = document.createElement("canvas");
canvas.width = width;
canvas.height = height;
document.body.append(canvas);

const gl = exists(canvas.getContext("webgl2"));

const createShader = (type: number, source: string) => {
  const shader = exists(gl.createShader(type));
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
    throw new Error(`${gl.getShaderInfoLog(shader)}`);
  return shader;
};

const createProgram = () => {
  const vertexShader = createShader(gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentSource);

  const program = exists(gl.createProgram());
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS))
    throw new Error(`${gl.getProgramInfoLog(program)}`);
  gl.useProgram(program);
  return program;
};

export default () => {
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

  const loop = () => {
    gl.uniform1f(locations.u_time, performance.now() / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(loop);
  };
  loop();
};
