/* Deterministic, testable scene transitions, shared by browser and tests. */
(function(root){
'use strict';
const palettes=[
 [[.04,.72,.68],[.12,.38,.95],[.62,.2,.96],[.96,.4,.72]],
 [[.43,.12,.65],[.93,.21,.44],[1,.48,.2],[1,.86,.5]],
 [[.02,.22,.62],[.04,.62,.84],[.32,.88,.94],[.7,.8,1]],
 [[.26,.1,.68],[.73,.2,.76],[1,.36,.6],[.65,.54,1]]
];
const smooth=x=>x*x*(3-2*x);
class Evolution {
 constructor(){this.weights=[1,0,0];this.colors=palettes[0].map(c=>c.slice());this.phase=0;this.colorPhase=0;}
 update(dt,config,bands){
  const bass=bands[0]*config.sensitivity,energy=(bands[0]*.55+bands[1]*.3+bands[2]*.15)*config.sensitivity;
  // Audio changes pace continuously; bounded envelopes prevent hard cuts.
  this.phase+=dt*(.035+energy*.14);
  this.colorPhase+=dt*(.025+config.colorSpeed*.11+energy*.13);
  const desired=[0,0,0];
  if(config.formation===0){const p=this.phase%3,i=Math.floor(p),f=smooth(p-i);desired[i]=1-f;desired[(i+1)%3]=f;}
  else desired[config.formation-1]=1;
  const blend=1-Math.exp(-dt*1.4);
  for(let i=0;i<3;i++)this.weights[i]+=(desired[i]-this.weights[i])*blend;
  const p=this.colorPhase%4,i=config.palette?config.palette-1:Math.floor(p),j=config.palette?i:(i+1)%4,f=config.palette?0:smooth(p-Math.floor(p));
  for(let c=0;c<4;c++)for(let n=0;n<3;n++){const target=palettes[i][c][n]*(1-f)+palettes[j][c][n]*f;this.colors[c][n]+=(target-this.colors[c][n])*blend;}
  return {weights:this.weights,colors:this.colors,bass,energy};
 }
}
if(typeof module!=='undefined')module.exports={Evolution};else root.FlowEvolution={Evolution};
})(typeof window!=='undefined'?window:globalThis);
