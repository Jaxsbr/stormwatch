import * as THREE from "three";
import type { Vec2 } from "./gait";

/** Keep illustrated vertices static; send only the current bone pose to the GPU. */
export class LegDeformation {
  readonly upper = { value: new THREE.Matrix3() };
  readonly lower = { value: new THREE.Matrix3() };
  readonly hipFoot = { value: new THREE.Vector4() };
  constructor(
    material: THREE.MeshBasicMaterial,
    frontal: boolean,
    kneeY: number,
    ankleY: number,
    sole: Vec2,
  ) {
    const uniforms = {
      swUpper: this.upper,
      swLower: this.lower,
      swHipFoot: this.hipFoot,
      swFrontal: { value: frontal ? 1 : 0 },
      swKneeY: { value: kneeY },
      swAnkleSole: { value: new THREE.Vector3(ankleY, sole.x, sole.y) },
    };
    material.customProgramCacheKey = () => "stormwatch-leg-deformation-v1";
    material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = `
        uniform mat3 swUpper;
        uniform mat3 swLower;
        uniform vec4 swHipFoot;
        uniform float swFrontal;
        uniform float swKneeY;
        uniform vec3 swAnkleSole;
      ${shader.vertexShader}`.replace(
        "#include <begin_vertex>",
        `vec3 transformed = position;
        if (swFrontal > 0.5) {
          float ankleY = swAnkleSole.x;
          vec2 sole = swAnkleSole.yz;
          vec2 hip = swHipFoot.xy;
          vec2 foot = swHipFoot.zw;
          if (position.y <= ankleY) {
            transformed.xy = foot + position.xy - sole;
          } else {
            float t = clamp(position.y / ankleY, 0.0, 1.0);
            transformed.xy = vec2(
              mix(hip.x + position.x, foot.x + position.x - sole.x, t),
              mix(hip.y, foot.y + ankleY - sole.y, t)
            );
          }
        } else {
          float blend = smoothstep(-swKneeY - 28.0, -swKneeY + 28.0, -position.y);
          transformed.xy = mix(
            (swUpper * vec3(position.xy, 1.0)).xy,
            (swLower * vec3(position.xy, 1.0)).xy,
            blend
          );
        }`,
      );
    };
  }
  setFront(hip: Vec2, foot: Vec2) {
    this.hipFoot.value.set(hip.x, hip.y, foot.x, foot.y);
  }
  setSide(
    hip: Vec2,
    knee: Vec2,
    nativeKnee: Vec2,
    upperAngle: number,
    lowerAngle: number,
  ) {
    const uc = Math.cos(upperAngle),
      us = Math.sin(upperAngle);
    const lc = Math.cos(lowerAngle),
      ls = Math.sin(lowerAngle);
    this.upper.value.set(uc, -us, hip.x, us, uc, hip.y, 0, 0, 1);
    this.lower.value.set(
      lc,
      -ls,
      knee.x - nativeKnee.x * lc + nativeKnee.y * ls,
      ls,
      lc,
      knee.y - nativeKnee.x * ls - nativeKnee.y * lc,
      0,
      0,
      1,
    );
  }
}
