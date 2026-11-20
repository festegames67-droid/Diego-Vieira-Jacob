import * as THREE from 'three';
import { BottleEdition } from '../data/editions';

export function createBottleAlbedoTexture(
  edition: BottleEdition,
  anisotropy: number
): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const [topCol, midCol, botCol] = edition.gradientStops;

  // Base vertical gradient matching real powder-coat finish
  const grad = ctx.createLinearGradient(0, 0, 0, size);
  grad.addColorStop(0.0, topCol);
  grad.addColorStop(0.18, topCol);
  grad.addColorStop(0.55, midCol);
  grad.addColorStop(0.88, botCol);
  grad.addColorStop(1.0, botCol);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Subtle Vice City diagonal ambient wrap light band
  const diag = ctx.createLinearGradient(0, 0, size, size);
  diag.addColorStop(0, 'rgba(255,255,255,0.06)');
  diag.addColorStop(0.5, 'rgba(255,255,255,0)');
  diag.addColorStop(1, 'rgba(0,0,0,0.12)');
  ctx.fillStyle = diag;
  ctx.fillRect(0, 0, size, size);

  // Subtle powder-coat micro-grain for tactile matte realism
  ctx.fillStyle = 'rgba(255,255,255,0.025)';
  for (let i = 0; i < 4200; i++) {
    const gx = ((i * 7919) % size);
    const gy = ((i * 6271) % size);
    ctx.fillRect(gx, gy, 1.5, 1.5);
  }

  // Subtle horizontal Vice stripe detail near lower base
  ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.fillRect(0, size * 0.875, size, 2);

  // Front face is centered around u = 0.5 (or u = 0.25 depending on Lathe rotation)
  // We align LatheGeometry rotation.y so u = 0.5 faces +Z (camera)
  const cx = size * 0.5;

  // Vertical crisp BUBI VICE wordmark
  ctx.save();
  ctx.translate(cx, size * 0.52);
  ctx.rotate(-Math.PI / 2);
  ctx.font = '700 68px "DM Sans", "Outfit", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
  ctx.shadowBlur = 6;
  ctx.fillText('BUBI  VICE', 0, 0);
  ctx.restore();

  // Subtle "650 ml" badge at the base front
  ctx.save();
  ctx.font = '500 22px "DM Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.82)';
  ctx.fillText('650 ML', cx, size * 0.845);
  ctx.restore();

  // Subtle Vice City horizon emblem on the back face (u = 0.0 / 1.0)
  const drawBackPalmBadge = (bx: number) => {
    ctx.save();
    ctx.translate(bx, size * 0.52);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 42, Math.PI, 0, false);
    ctx.stroke();
    for (let k = -1; k <= 1; k++) {
      ctx.beginPath();
      ctx.moveTo(-36, 12 + k * 10);
      ctx.lineTo(36, 12 + k * 10);
      ctx.stroke();
    }
    ctx.restore();
  };
  drawBackPalmBadge(0);
  drawBackPalmBadge(size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.anisotropy = anisotropy;
  tex.needsUpdate = true;
  return tex;
}

export function createMatteRoughnessTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Base roughness around 0.78 -> ~200 in 0-255 grayscale
  ctx.fillStyle = 'rgb(202, 202, 202)';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 3200; i++) {
    const x = (i * 3571) % size;
    const y = (i * 5113) % size;
    const v = 185 + ((i * 17) % 34);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(x, y, 2, 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.NoColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.needsUpdate = true;
  return tex;
}

export function createBraidedCordTexture(accentHex: string): THREE.CanvasTexture {
  const w = 128;
  const h = 128;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#181622';
  ctx.fillRect(0, 0, w, h);

  // Diagonal braided paracord weave with subtle neon fleck
  ctx.lineWidth = 6;
  for (let y = -h; y < h * 2; y += 16) {
    ctx.strokeStyle = '#272336';
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y + w * 0.5);
    ctx.stroke();

    ctx.strokeStyle = '#110f1a';
    ctx.beginPath();
    ctx.moveTo(w, y);
    ctx.lineTo(0, y + w * 0.5);
    ctx.stroke();
  }

  // Subtle accent thread fleck every 32px
  ctx.fillStyle = accentHex;
  for (let y = 8; y < h; y += 32) {
    for (let x = 8; x < w; x += 32) {
      ctx.fillRect(x, y, 5, 3);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(16, 2);
  tex.needsUpdate = true;
  return tex;
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(
    size / 2,
    size / 2,
    size * 0.08,
    size / 2,
    size / 2,
    size * 0.5
  );
  grad.addColorStop(0, 'rgba(6, 4, 14, 0.72)');
  grad.addColorStop(0.5, 'rgba(6, 4, 14, 0.34)');
  grad.addColorStop(1, 'rgba(6, 4, 14, 0.0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}
