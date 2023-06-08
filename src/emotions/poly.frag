precision mediump float;
varying vec4 v_position;
uniform float u_time;
uniform float u_threshold;

const int deg = 5;
vec2 roots[deg];

vec2 mul(vec2 a, vec2 b) {
  return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.y);
}

vec2 div(vec2 a, vec2 b) {
  return mul(a, vec2(b.x, -b.y)) / (b.x * b.x + b.y * b.y);
}

vec2 inv(vec2 a) { return vec2(a.x, -a.y) / (a.x * a.x + a.y * a.y); }

vec2 f(vec2 a) {
  vec2 ret = vec2(1.0, 0.0);
  for (int i = 0; i < deg; i++) {
    ret = mul(ret, a - roots[i]);
  }
  return ret;
}

vec2 fp(vec2 a) {
  vec2 sum = vec2(0.0, 0.0);
  for (int i = 0; i < deg; i++) {
    sum += inv(a - roots[i]);
  }
  return inv(sum);
}

vec4 col(vec2 a) {
  return vec4(
    1. / (1.0 + abs(a.x)),
    1. / (1.0 + abs(a.y)),
    1. / (1.0 + 0.1 * abs(a.y)),
    (1. / (1.0 + 0.1 * abs(a.y)))>u_threshold?.5:0.
  );
}

void main() {
  roots[0] = vec2(cos(0.6 * u_time), sin(0.6 * u_time));
  roots[1] = vec2(cos(0.4 * u_time), sin(0.5 * u_time));
  roots[2] = vec2(cos(0.1 * u_time), sin(0.1 * u_time));
  roots[3] = vec2(cos(0.1 * u_time), sin(0.3 * u_time));
  roots[4] = vec2(cos(0.3 * u_time), sin(0.4 * u_time));
  vec2 u0 = v_position.xy;
  vec2 u = u0;
  for (int i = 0; i < 3; i++) {
    u -= div(f(u), fp(u));
  }
  gl_FragColor = col(u);
}
