import { LegDeformation } from "./leg-deformation";
import * as THREE from "three";
import { solveTwoBone } from "./ik";
import {
  gaitOnPath,
  createPathGaitWorkspace,
  type PathGaitWorkspace,
} from "./gait";
import { CutoutInstance, type CutoutPart, type CutoutResource } from "./cutout";

type Leg = {
  part: CutoutPart;
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  deformation: LegDeformation;
  hip: { x: number; y: number };
  knee: { x: number; y: number };
  sole: { x: number; y: number };
  ankle: { x: number; y: number };
  gait: PathGaitWorkspace;
};
/** Two-bone cloth deformation preserves the illustrated boot as one rigid part. */
export class CharacterRig {
  readonly cutout: CutoutInstance;
  readonly group: THREE.Group;
  private legs: Leg[] = [];
  private readonly scale: number;
  private readonly hipHeight: number;
  private readonly frontal: boolean;
  constructor(resource: CutoutResource, height = 88) {
    this.cutout = new CutoutInstance(resource, height);
    this.group = this.cutout.group;
    this.scale = this.group.scale.x;
    this.frontal =
      resource.definition!.view === "front" ||
      resource.definition!.view === "rear";
    const hipHeight = resource.definition!.animation?.hipHeight;
    this.hipHeight =
      typeof hipHeight === "number" &&
      Number.isFinite(hipHeight) &&
      hipHeight > 0
        ? hipHeight
        : 145;
    for (const part of resource.definition!.parts) {
      if (!part.joints?.knee || !part.joints?.sole) continue;
      const sprite = this.cutout.parts.get(part.id)!;
      sprite.visible = false;
      const [, , w, h] = part.rect;
      const jointHip = part.joints.hip ?? part.pivot;
      const geometry = new THREE.PlaneGeometry(
        w * part.scale,
        h * part.scale,
        2,
        20,
      );
      const positions = geometry.attributes.position;
      for (let i = 0; i < positions.count; i++)
        positions.setXY(
          i,
          positions.getX(i) + (w / 2 - jointHip[0]) * part.scale,
          positions.getY(i) + (jointHip[1] - h / 2) * part.scale,
        );
      const mesh = new THREE.Mesh(
        geometry,
        new THREE.MeshBasicMaterial({
          map: resource.textures.get(part.id),
          transparent: true,
          alphaTest: 0.02,
          depthTest: false,
          depthWrite: false,
          side: THREE.DoubleSide,
          // Flat cutouts have no back-face volume to composite separately.
          forceSinglePass: true,
        }),
      );
      // The deformation is affine across each horizontal strip. Extra columns
      // add CPU/upload cost without helping the knee silhouette. Characters
      // already stay on the bounded path; skip per-frame sphere recomputation.
      mesh.frustumCulled = false;
      this.group.add(mesh);
      const local = (p: [number, number]) => ({
        x: (p[0] - jointHip[0]) * part.scale,
        y: (jointHip[1] - p[1]) * part.scale,
      });
      this.legs.push({
        part,
        mesh,
        gait: createPathGaitWorkspace(),
        deformation: new LegDeformation(
          mesh.material,
          this.frontal,
          local(part.joints.knee).y,
          local(part.joints.ankle ?? part.joints.sole).y,
          local(part.joints.sole),
        ),
        hip: {
          x: sprite.position.x + (jointHip[0] - part.pivot[0]) * part.scale,
          y: sprite.position.y + (part.pivot[1] - jointHip[1]) * part.scale,
        },
        knee: local(part.joints.knee),
        sole: local(part.joints.sole),
        ankle: local(part.joints.ankle ?? part.joints.sole),
      });
    }
  }
  update(
    distance: number,
    pointAtDistance: (
      distance: number,
      out?: { x: number; y: number },
    ) => { x: number; y: number },
    order: number,
    color: THREE.ColorRepresentation,
    hitAge = Infinity,
  ) {
    this.cutout.reset(order, color);
    const phase = (distance / 0.65) % 1;
    const impact =
      hitAge >= 0 && hitAge < 0.2 ? Math.sin((Math.PI * hitAge) / 0.2) : 0;
    const hipHeight =
      this.hipHeight + Math.cos(phase * Math.PI * 4) * 5 - impact * 10;
    const body = this.cutout.parts.get("body")!;
    body.position.y = hipHeight;
    body.position.x = -impact * (this.frontal ? 10 : 24);
    body.material.rotation = impact * 0.045;
    for (const [index, leg] of this.legs.entries()) {
      const hip = { x: leg.hip.x + body.position.x, y: hipHeight + leg.hip.y };
      const { foot } = gaitOnPath(
        distance,
        index === 0 ? 0 : 1,
        pointAtDistance,
        this.scale,
        leg.gait,
      );
      // Preserve each view's anatomical hip ordering. Front-facing art reverses
      // screen-left/right relative to the side view; fixed offsets cross its legs.
      foot.x += leg.hip.x - (index === 0 ? 35 : -35);
      if (this.frontal) {
        // Knees flex in depth when viewed head-on. Project the cloth vertically
        // instead of bending both knees sideways in the image plane. Keep each
        // illustrated boot upright and rigid, with its sole at the gait target.
        leg.deformation.setFront(hip, foot);
        leg.mesh.material.color.set(color);
        leg.mesh.renderOrder = order + leg.part.z * 0.01;
        continue;
      }
      const upper = Math.hypot(leg.knee.x, leg.knee.y),
        lower = Math.hypot(leg.sole.x - leg.knee.x, leg.sole.y - leg.knee.y);
      const pose = solveTwoBone(hip, foot, upper, lower, 1);
      const upperAngle =
        Math.atan2(pose.knee.y - hip.y, pose.knee.x - hip.x) -
        Math.atan2(leg.knee.y, leg.knee.x);
      const lowerAngle =
        Math.atan2(pose.foot.y - pose.knee.y, pose.foot.x - pose.knee.x) -
        Math.atan2(leg.sole.y - leg.knee.y, leg.sole.x - leg.knee.x);
      leg.deformation.setSide(hip, pose.knee, leg.knee, upperAngle, lowerAngle);
      leg.mesh.material.color.set(color);
      leg.mesh.renderOrder = order + leg.part.z * 0.01;
    }
  }
  dispose() {
    this.legs.forEach((l) => {
      l.mesh.geometry.dispose();
      l.mesh.material.dispose();
    });
    this.cutout.dispose();
  }
}
