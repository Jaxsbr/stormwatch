import {describe,it,expect} from 'vitest';
import {Game} from '../src/sim/game';
import {lanternPass} from '../src/content/lantern-pass';
import type {TowerKind} from '../src/sim/types';
const dt=1/30;
function encounter(){const game=new Game({...lanternPass,width:32,path:[{x:-1,z:3},{x:30,z:3}],waves:[{title:'Guard',reward:0,groups:[{kind:'raider',count:1,gap:1}]}]});game.startWave();return game;}
function step(g:Game,seconds:number){for(let i=0;i<Math.round(seconds*30);i++)g.tick(dt);}
function shot(g:Game,kind:TowerKind='bolt',damage=14,duration=dt){const e=g.state.enemies[0];g.state.shots.push({id:1000,source:{x:0,z:2},x:e.x,z:e.z,target:{x:e.x,z:e.z},targetId:e.id,kind,damage,life:0,duration});}
describe('rat guard',()=>{
 it('cycles per spawn, continues walking, and freezes when paused',()=>{const g=encounter();step(g,1);const e=g.state.enemies[0];expect(e.shieldRaised).toBe(false);step(g,1);expect(e.shieldRaised).toBe(true);const d=e.distance;g.pause();step(g,2);expect(e.distance).toBe(d);expect(e.shieldRaised).toBe(true);g.pause();step(g,2);expect(e.distance).toBeGreaterThan(d);expect(e.shieldRaised).toBe(false);step(g,3);expect(e.shieldRaised).toBe(true);});
 it.each(['bolt','stone','net'] as const)('halves %s projectile damage and emits only a thud hit cue',kind=>{const g=encounter();step(g,2);const e=g.state.enemies[0];const hp=e.hp;g.drainEvents();shot(g,kind,15);g.tick(dt);expect(e.hp).toBe(hp-7.5);expect(e.hitAt).toBe(-1);expect(g.state.effects.some(f=>f.kind==='hit')).toBe(false);expect(g.drainEvents().map(e=>e.type)).toEqual(['shield-hit']);if(kind==='net')expect(e.slowUntil).toBeGreaterThan(g.state.clock);});
 it('uses guard at impact, and restores ordinary hits after lowering',()=>{const g=encounter();step(g,1.5);const e=g.state.enemies[0];shot(g,'bolt',14,.5);step(g,.6);expect(e.hp).toBe(47);step(g,2);g.drainEvents();shot(g);g.tick(dt);expect(e.hp).toBe(33);expect(e.hitAt).toBe(g.state.clock);expect(g.drainEvents().map(e=>e.type)).toEqual(['hit']);});
 it('does not halve rescue damage or guard other enemy kinds',()=>{const g=encounter();step(g,2);const e=g.state.enemies[0];e.hp=100;g.rescue({x:e.x,z:e.z});expect(e.hp).toBe(40);e.kind='runner';e.shieldRaised=false;shot(g);g.tick(dt);expect(e.hp).toBe(26);});
});

