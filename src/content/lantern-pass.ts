import type { LevelDef } from '../sim/types';
export const lanternPass: LevelDef = {
  id:'lantern-pass',name:'Lantern Pass',subtitle:'01 / THE FIRST WATCH',
  description:'The last wagons are crossing the forest. Keep the lantern line burning until they reach home.',
  width:12,depth:8,accent:'#caab6c',startCoins:175,
  path:[{x:-1,z:3},{x:2,z:3},{x:2,z:1},{x:6,z:1},{x:6,z:6},{x:9,z:6},{x:9,z:3},{x:12,z:3}],
  blocked:[{x:0,z:0},{x:0,z:7},{x:11,z:0},{x:11,z:7}],
  waves:[
    {title:'Footsteps in the rain',reward:25,groups:[{kind:'raider',count:9,gap:2.2}]},
    {title:'A quicker shadow',reward:28,groups:[{kind:'raider',count:8,gap:1.8},{kind:'runner',count:5,gap:1.6}]},
    {title:'Iron on the trail',reward:30,groups:[{kind:'armored',count:4,gap:3},{kind:'raider',count:10,gap:1.4}]},
    {title:'The long column',reward:34,groups:[{kind:'raider',count:16,gap:1.1},{kind:'runner',count:8,gap:1.1}]},
    {title:'Hold the crossing',reward:38,groups:[{kind:'armored',count:9,gap:1.7},{kind:'runner',count:10,gap:1.1}]},
    {title:'The Roadwarden arrives',reward:45,groups:[{kind:'armored',count:6,gap:2},{kind:'boss',count:1,gap:4},{kind:'raider',count:16,gap:1.2}]},
    {title:'Briar and iron',reward:50,groups:[{kind:'armored',count:10,gap:1.4},{kind:'runner',count:12,gap:0.9},{kind:'raider',count:12,gap:0.9}]},
    {title:'The lantern line',reward:65,groups:[{kind:'armored',count:8,gap:1.8},{kind:'runner',count:12,gap:0.9},{kind:'boss',count:2,gap:3.5},{kind:'raider',count:20,gap:0.9}]},
  ],
};
