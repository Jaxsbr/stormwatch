import * as THREE from "three";

/** Lightweight rope lattice for an unfolding projectile, with weighted corners. */
export function netGeometry() {
  const strands: THREE.Shape[] = [];
  for (let row = -1; row <= 1; row++) {
    for (let column = -1; column <= 1; column++) {
      const x = column * 5 - 2.5,
        y = row * 5 - 2.5;
      const shape = new THREE.Shape();
      shape.moveTo(x, y);
      shape.lineTo(x + 5, y);
      shape.lineTo(x + 5, y + 5);
      shape.lineTo(x, y + 5);
      shape.closePath();
      const hole = new THREE.Path();
      hole.moveTo(x + 0.45, y + 0.45);
      hole.lineTo(x + 0.45, y + 4.55);
      hole.lineTo(x + 4.55, y + 4.55);
      hole.lineTo(x + 4.55, y + 0.45);
      hole.closePath();
      shape.holes.push(hole);
      strands.push(shape);
    }
  }
  for (const x of [-7.5, 7.5])
    for (const y of [-7.5, 7.5]) {
      const knot = new THREE.Shape();
      knot.absarc(x, y, 1.2, 0, Math.PI * 2, false);
      strands.push(knot);
    }
  return new THREE.ShapeGeometry(strands, 4);
}
