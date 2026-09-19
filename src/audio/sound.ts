import type { GameEvent } from '../sim/types';
export class Sound {
  private context:AudioContext|null=null;
  private music=new Audio(`${import.meta.env.BASE_URL}audio/expedition.mp3`);
  private last:Record<string,number>={};
  musicVolume=.45;effectsVolume=.6;muted=false;
  constructor(){this.music.loop=true;this.music.preload='none';}
  unlock(){this.context??=new AudioContext();void this.context.resume();this.apply();if(!this.muted)void this.music.play().catch(()=>{});}
  apply(){this.music.volume=this.musicVolume*.5;this.music.muted=this.muted;}
  pause(paused:boolean){if(paused)this.music.pause();else if(this.context&&!this.muted)void this.music.play().catch(()=>{});}
  setMuted(value:boolean){this.muted=value;this.apply();if(value)this.music.pause();else this.unlock();}
  play(type:GameEvent['type']|'ui'){
    const ctx=this.context;if(!ctx||this.muted||this.effectsVolume===0)return;const now=ctx.currentTime;if(now-(this.last[type]??-10)<(type==='shot'?.1:type==='hit'?.08:.025))return;this.last[type]=now;
    const tones:Record<string,[number,number,number]>={ui:[440,.06,.08],build:[220,.16,.14],upgrade:[660,.24,.14],sell:[330,.1,.1],shot:[150,.035,.025],hit:[80,.045,.045],kill:[300,.06,.05],leak:[100,.26,.1],start:[294,.25,.12],payout:[784,.18,.13],win:[523,.25,.15],loss:[147,.5,.12],supply:[587,.3,.12]};
    const [hz,length,volume]=tones[type]??tones.ui;this.tone(hz,length,volume,now,type==='shot'||type==='hit'?'triangle':'sine');
    if(type==='win'||type==='upgrade'||type==='payout'){this.tone(hz*1.25,length,.1,now+.11);this.tone(hz*1.5,length*1.5,.1,now+.22);}
  }
  private tone(hz:number,length:number,volume:number,start:number,wave:OscillatorType='sine'){const ctx=this.context!;const o=ctx.createOscillator(),g=ctx.createGain();o.type=wave;o.frequency.setValueAtTime(hz,start);o.frequency.exponentialRampToValueAtTime(hz*.85,start+length);g.gain.setValueAtTime(.001,start);g.gain.exponentialRampToValueAtTime(Math.max(.001,volume*this.effectsVolume),start+.008);g.gain.exponentialRampToValueAtTime(.001,start+length);o.connect(g);g.connect(ctx.destination);o.start(start);o.stop(start+length+.02);}
}
