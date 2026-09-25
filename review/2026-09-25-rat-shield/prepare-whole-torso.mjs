import sharp from 'sharp';
import {readFile,writeFile,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const sourceRoot=process.argv[2];
if(!sourceRoot) throw new Error('Pass the native generation directory');
const out='review/2026-09-25-rat-shield/assets/whole-torso-v3';
const sources={side:['82da9265-987a-4b64-b593-284c7a867f57','fd301aeb-bc3c-48cc-b835-5f3c2d58c231'],front:['39f10a3c-4075-4c45-877b-0be50037246a','6ec9071d-d0fe-4b7b-b249-974ec2679a41'],rear:['d74a7f87-2f21-497f-bfa5-06d3b5757b39','4900f2a3-1202-47d4-a078-4a3ea28098fa']};
const manifest={status:'review only; not integrated',generator:'native image_gen',views:{}};
for(const [view,ids] of Object.entries(sources)){
 const rigId=view==='side'?'rat-rig-v1':`rat-${view}-rig-v1`;
 const rig=JSON.parse(await readFile(`public/art/v2/${rigId}/rig.json`,'utf8'));
 const body=rig.parts.find(p=>p.id==='body');
 await copyFile(`public/art/v2/${rigId}/body.webp`,`${out}/${view}-down.webp`);
 const v={originalRig:rigId,body:{width:body.rect[2],height:body.rect[3]},legs:[],sources:[]};
 for(let i=0;i<2;i++){
  const src=`${sourceRoot}/exec-${ids[i]}.png`, type=i?'legs':'up';
  const source=`assets/source/reboot/rat-whole-torso-v3/${view}-${type}.png`;
  await copyFile(src,source);
  v.sources.push({source,sha256:createHash('sha256').update(await readFile(src)).digest('hex')});
  if(!i){ const meta=await sharp(src).metadata(); await sharp(src).webp({lossless:true}).toFile(`${out}/${view}-up.webp`);v.up={scale:view==='front'?.56:view==='rear'?.53:body.rect[2]/meta.width,x:view==='side'?8:view==='front'?42:-28,y:0};continue;}
  const {data,info}=await sharp(src).raw().toBuffer({resolveWithObject:true});
  for(let half=0;half<2;half++){
   let minX=info.width,minY=info.height,maxX=0,maxY=0;
   for(let y=0;y<info.height;y++)for(let x=Math.floor(half*info.width/2);x<Math.floor((half+1)*info.width/2);x++)if(data[(y*info.width+x)*4+3]>10){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
   const rect={left:minX,top:minY,width:maxX-minX+1,height:maxY-minY+1};
   await sharp(src).extract(rect).webp({lossless:true}).toFile(`${out}/${view}-leg-${half}.webp`);
   v.legs.push({file:`${view}-leg-${half}.webp`,rect,pivot:[view==='side'?rect.width*.29:rect.width*.5,24],x: view==='side'?[450,360][half]:view==='front'?[350,500][half]:[255,355][half],y:view==='side'?[525,508][half]:view==='front'?520:510,rotation:0,label:view==='side'?['Outer / near (right leg)','Inner / far (left leg)'][half]:view==='front'?['Right leg (screen left)','Left leg (screen right)'][half]:['Left leg (screen left)','Right leg (screen right)'][half]});
  }
  // One shared scale for each pair, preserving the generated size relationship.
  v.legScale=290/Math.max(...v.legs.map(l=>l.rect.height));
 }
 manifest.views[view]=v;
}
await writeFile(`${out}/manifest.json`,JSON.stringify(manifest,null,2)+'\n');
