// Interactive 3D Rotating Architectural Wireframe & Flip-Top 650 ml Cross-Section
export function initSpecsCanvas(canvas: HTMLCanvasElement | null): () => void {
  if (!canvas) return () => {};
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let angle = 0;
  const targetSpeed = 0.008;
  let hoverBoost = 0;
  let rafId = 0;

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.floor(canvas.clientWidth * dpr);
    const h = Math.floor(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
  };

  const onEnter = () => {
    hoverBoost = 0.02;
  };
  const onLeave = () => {
    hoverBoost = 0;
  };

  const parent = canvas.parentElement;
  parent?.addEventListener('pointerenter', onEnter);
  parent?.addEventListener('pointerleave', onLeave);
  window.addEventListener('resize', resize, { passive: true });
  resize();

  // 650 ml BUBI VICE bottle profile with ergonomic flip-top cap
  const rings = [
    { y: -0.92, r: 0.42 },
    { y: -0.84, r: 0.47 },
    { y: 0.24, r: 0.47 },
    { y: 0.42, r: 0.36 },
    { y: 0.50, r: 0.34 },
    { y: 0.55, r: 0.39 },
    { y: 0.78, r: 0.39 },
    { y: 0.90, r: 0.35 },
    { y: 0.98, r: 0.28 },
  ];

  const draw = () => {
    resize();
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const strokeMain = 'rgba(248, 247, 252, 0.22)';
    const strokePink = 'rgba(255, 46, 147, 0.85)';
    const strokeCyan = 'rgba(0, 229, 255, 0.78)';

    const cx = w * 0.72;
    const cy = h * 0.48;
    const scaleY = Math.min(w, h) * 0.38;
    const scaleX = scaleY * 0.84;

    if (!prefersReduced) {
      angle += targetSpeed + hoverBoost;
    }

    ctx.lineWidth = Math.max(1.2, w / 420);
    for (let i = 0; i < rings.length; i++) {
      const { y, r } = rings[i];
      ctx.beginPath();
      if (i === 5 || i === 6) ctx.strokeStyle = strokePink;
      else if (i === 4) ctx.strokeStyle = strokeCyan;
      else ctx.strokeStyle = strokeMain;
      const rx = r * scaleX;
      const ry = r * scaleX * 0.22;
      const py = cy - y * scaleY;
      ctx.ellipse(cx, py, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    const meridians = 12;
    for (let m = 0; m < meridians; m++) {
      const theta = angle + (m * Math.PI * 2) / meridians;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);

      ctx.beginPath();
      ctx.strokeStyle =
        m % 4 === 0 ? strokePink : m % 4 === 2 ? strokeCyan : strokeMain;
      for (let i = 0; i < rings.length; i++) {
        const { y, r } = rings[i];
        const px = cx + cosT * r * scaleX;
        const py = cy - y * scaleY + sinT * r * scaleX * 0.22;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    if (!prefersReduced) {
      rafId = requestAnimationFrame(draw);
    }
  };

  rafId = requestAnimationFrame(draw);

  return () => {
    cancelAnimationFrame(rafId);
    parent?.removeEventListener('pointerenter', onEnter);
    parent?.removeEventListener('pointerleave', onLeave);
    window.removeEventListener('resize', resize);
  };
}
