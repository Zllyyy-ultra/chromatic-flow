/* Shared by the offline browser build and Node tests. */
(function(root){
  'use strict';
  const clamp=(value,min=0,max=1)=>Number.isFinite(value)?Math.max(min,Math.min(max,value)):min;
  class AudioEnvelope {
    constructor(){this.target=[0,0,0];this.values=[0,0,0];this.last=-Infinity;}
    receive(data,now){
      if(!data||data.length!==128)return false;
      const ranges=[[0,8],[8,32],[32,64]],gain=[1.8,2.1,2.8];
      for(let b=0;b<3;b++){
        let total=0;const [start,end]=ranges[b];
        for(let i=start;i<end;i++)total+=(clamp(data[i])+clamp(data[i+64]))*.5;
        this.target[b]=clamp(total/(end-start)*gain[b]);
      }
      this.last=now;return true;
    }
    update(dt,now,demo,time){
      let target=this.target;
      if(demo)target=[.08+.8*Math.pow(Math.max(0,Math.sin(time*5.8)),8),.2+.22*Math.sin(time*1.9)**2,.06+.4*Math.pow(Math.max(0,Math.sin(time*11.6)),12)];
      else if(now-this.last>500)target=[0,0,0];
      for(let i=0;i<3;i++)this.values[i]+=(target[i]-this.values[i])*(1-Math.exp(-clamp(dt,0,.1)*(target[i]>this.values[i]?10:2.3)));
      return this.values;
    }
  }
  if(typeof module!=='undefined')module.exports={AudioEnvelope,clamp};
  else root.FlowAudio={AudioEnvelope,clamp};
})(typeof window!=='undefined'?window:globalThis);
