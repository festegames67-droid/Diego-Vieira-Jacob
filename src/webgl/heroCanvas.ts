// Procedural WebGL2 Vice City Neon Horizon & Contours Backdrop
export function initHeroCanvas(canvas: HTMLCanvasElement | null): () => void {
  if (!canvas) return () => {};
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    antialias: false,
    powerPreference: 'low-power',
  });
  if (!gl) return () => {};

  const vsSource = `#version 300 es
  in vec2 a_pos;
  out vec2 v_uv;
  void main() {
    v_uv = a_pos * 0.5 + 0.5;
    gl_Position = vec4(a_pos, 0.0, 1.0);
  }`;

  const fsSource = `#version 300 es
  precision highp float;
  in vec2 v_uv;
  out vec4 outColor;

  uniform float u_time;
  uniform vec2 u_mouse;
  uniform vec2 u_res;
  uniform vec3 u_accentA;
  uniform vec3 u_accentB;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  void main() {
    vec2 uv = v_uv;
    float aspect = u_res.x / max(u_res.y, 1.0);
    vec2 p = (uv - 0.5) * vec2(aspect, 1.0);

    float n1 = noise(p * 2.1 + vec2(u_time * 0.035, -u_time * 0.02));
    float n2 = noise(p * 4.5 - vec2(u_time * 0.025, u_time * 0.015));
    float elev = n1 * 0.65 + n2 * 0.35;

    float contour = abs(fract(elev * 7.0) - 0.5);
    float line = smoothstep(0.475, 0.496, contour);

    vec2 mPos = (u_mouse - 0.5) * vec2(aspect, 1.0);
    float dist = length(p - mPos);
    float glow = exp(-dist * dist * 2.1);

    // Subtle Vice City horizon perspective grid on lower third
    float horizon = smoothstep(0.42, 0.0, uv.y);
    float gridY = abs(fract(1.0 / max(0.06, 0.44 - uv.y) * 0.55 - u_time * 0.12) - 0.5);
    float gridLine = smoothstep(0.46, 0.495, gridY) * horizon * step(uv.y, 0.42);

    vec3 baseCol = vec3(0.043, 0.035, 0.078); // #0b0914 deep midnight violet
    vec3 col = baseCol;
    col = mix(col, u_accentA, glow * 0.14);
    col += mix(u_accentA, u_accentB, uv.x) * line * 0.065;
    col += u_accentB * gridLine * 0.055;

    outColor = vec4(col, 1.0);
  }`;

  const compile = (type: number, src: string): WebGLShader | null => {
    const sh = gl.createShader(type);
    if (!sh) return null;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      gl.deleteShader(sh);
      return null;
    }
    return sh;
  };

  const prog = gl.createProgram();
  if (!prog) return () => {};
  const vs = compile(gl.VERTEX_SHADER, vsSource);
  const fs = compile(gl.FRAGMENT_SHADER, fsSource);
  if (!vs || !fs) {
    if (vs) gl.deleteShader(vs);
    if (fs) gl.deleteShader(fs);
    gl.deleteProgram(prog);
    return () => {};
  }
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    gl.deleteProgram(prog);
    return () => {};
  }

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW
  );

  const aPos = gl.getAttribLocation(prog, 'a_pos');
  const uTime = gl.getUniformLocation(prog, 'u_time');
  const uMouse = gl.getUniformLocation(prog, 'u_mouse');
  const uRes = gl.getUniformLocation(prog, 'u_res');
  const uAccentA = gl.getUniformLocation(prog, 'u_accentA');
  const uAccentB = gl.getUniformLocation(prog, 'u_accentB');

  let mouseX = 0.72;
  let mouseY = 0.52;
  let targetX = 0.72;
  let targetY = 0.52;
  let rafId = 0;

  const resize = () => {
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = Math.floor(canvas.clientWidth * dpr);
    const h = Math.floor(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
  };

  const onPointerMove = (e: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    targetX = (e.clientX - rect.left) / rect.width;
    targetY = 1.0 - (e.clientY - rect.top) / rect.height;
  };

  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('resize', resize, { passive: true });
  resize();

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const start = performance.now();

  const render = (now: number) => {
    resize();
    mouseX += (targetX - mouseX) * 0.08;
    mouseY += (targetY - mouseY) * 0.08;
    const t = prefersReduced ? 0.0 : (now - start) * 0.001;

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(prog);
    gl.enableVertexAttribArray(aPos);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    gl.uniform1f(uTime, t);
    gl.uniform2f(uMouse, mouseX, mouseY);
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform3f(uAccentA, 1.0, 0.18, 0.576); // Neon Magenta #FF2E93
    gl.uniform3f(uAccentB, 0.0, 0.898, 1.0);  // Electric Cyan #00E5FF

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    if (!prefersReduced) {
      rafId = requestAnimationFrame(render);
    }
  };

  rafId = requestAnimationFrame(render);

  return () => {
    cancelAnimationFrame(rafId);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('resize', resize);
  };
}
