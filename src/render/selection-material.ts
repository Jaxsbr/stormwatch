import * as THREE from "three";

/** Feathered coverage halo: no hard polygon edge or opaque disk over terrain. */
export function selectionMaterial(base = false) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthTest: false,
    depthWrite: false,
    uniforms: { time: { value: 0 }, base: { value: base ? 1 : 0 } },
    vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `varying vec2 vUv; uniform float time; uniform float base;
    void main(){
      vec2 p=(vUv-.5)*2.; float d=length(p);
      float rim=exp(-pow((d-.87)/.065,2.));
      float pulse=.75+.25*sin(time*2.8);
      float a=atan(p.y,p.x);
      float glint=pow(max(0.,cos(a*3.-time*.7)),14.);
      float alpha=base>.5 ? (rim*.6+exp(-d*d*4.)*.22)*pulse : rim*(.12+.13*glint);
      gl_FragColor=vec4(mix(vec3(.35,.88,.72),vec3(1.,.85,.42),base),alpha);
    }`,
  });
}
