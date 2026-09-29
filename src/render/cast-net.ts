import * as THREE from "three";

/** The accepted turtle study's hanging rope net, opening into a weighted disk. */
export function updateCastNet(
  geometry: THREE.BufferGeometry,
  left: THREE.Vector3,
  right: THREE.Vector3,
  opening = 0,
  size = 1,
  mirrored = false,
) {
  const center = left.clone().lerp(right, 0.5);
  const surface = (u: number, v: number) => {
    const folded = new THREE.Vector3(
      THREE.MathUtils.lerp(left.x, right.x, u) +
        (mirrored ? -1 : 1) * (u - 0.5) * 35 * v * size,
      THREE.MathUtils.lerp(left.y, right.y, u) -
        ((35 + v * 145) * Math.sin(Math.PI * u) + v * 25) * size,
      0,
    );
    const x = (u - 0.5) * 2,
      y = (v - 0.5) * 2;
    const radius = THREE.MathUtils.lerp(105, 250, opening) * size;
    const disk = new THREE.Vector3(
      center.x + (mirrored ? -1 : 1) * x * Math.sqrt(1 - (y * y) / 2) * radius,
      center.y + y * Math.sqrt(1 - (x * x) / 2) * radius * 0.56,
      0,
    );
    return folded.lerp(disk, opening);
  };
  const vertices: number[] = [];
  const rope = (a: THREE.Vector3, b: THREE.Vector3, width: number) => {
    const dx = b.x - a.x,
      dy = b.y - a.y;
    const length = Math.hypot(dx, dy) || 1;
    const nx = ((((mirrored ? 1 : -1) * dy) / length) * width) / 2,
      ny = ((((mirrored ? -1 : 1) * dx) / length) * width) / 2;
    vertices.push(
      a.x + nx,
      a.y + ny,
      0,
      a.x - nx,
      a.y - ny,
      0,
      b.x + nx,
      b.y + ny,
      0,
      b.x + nx,
      b.y + ny,
      0,
      a.x - nx,
      a.y - ny,
      0,
      b.x - nx,
      b.y - ny,
      0,
    );
  };
  for (let u = 0; u < 8; u++)
    for (let v = 0; v < 8; v++) {
      rope(surface(u / 8, v / 8), surface((u + 1) / 8, v / 8), 2.8 * size);
      rope(surface(u / 8, v / 8), surface(u / 8, (v + 1) / 8), 2.8 * size);
    }
  const border: THREE.Vector3[] = [];
  for (let j = 0; j <= 48; j++) {
    const q = j / 12;
    border.push(
      q <= 1
        ? surface(q, 0)
        : q <= 2
          ? surface(1, q - 1)
          : q <= 3
            ? surface(3 - q, 1)
            : surface(0, 4 - q),
    );
  }
  for (let i = 0; i < 48; i++) rope(border[i], border[i + 1], 5 * size);
  for (let i = 0; i < 16; i++) {
    const p = border[i * 3];
    for (let j = 0; j < 10; j++) {
      const a = (j / 10) * Math.PI * 2,
        b = ((j + 1) / 10) * Math.PI * 2;
      vertices.push(
        p.x,
        p.y,
        0,
        p.x + (mirrored ? -1 : 1) * Math.cos(a) * 8 * size,
        p.y + Math.sin(a) * 8 * size,
        0,
        p.x + (mirrored ? -1 : 1) * Math.cos(b) * 8 * size,
        p.y + Math.sin(b) * 8 * size,
        0,
      );
    }
  }
  let positions = geometry.getAttribute("position") as
    THREE.BufferAttribute | undefined;
  if (!positions) {
    positions = new THREE.Float32BufferAttribute(vertices, 3);
    positions.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute("position", positions);
  } else {
    positions.array.set(vertices);
    positions.needsUpdate = true;
  }
}
