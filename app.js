(()=>{
'use strict';
const {AudioEnvelope,clamp}=window.FlowAudio;
const canvas=document.getElementById('scene'),error=document.getElementById('error');
const config={sensitivity:.65,velocity:.35,brightness:.6,density:1,spread:.55,colorSpeed:.4,formation:0,palette:0,particle:1};
const evolution=new window.FlowEvolution.Evolution();
const choices={formation:['自动漫游','流光丝带','星际旋涡','漂浮星云'],palette:['自动变幻','极光','落日','深海','绯梦'],particle:['柔光微尘','闪烁星芒','空灵光环']};
const audio=new AudioEnvelope();
const host=typeof window.wallpaperRegisterAudioListener==='function';
const state={demo:false,userPaused:false,hostPaused:false,lost:false,frames:0,time:0,fps:0,backend:'',drawCount:0};
if(host)document.body.classList.add('wallpaper');
if(new URLSearchParams(location.search).has('clean'))document.body.classList.add('hide-ui');
let gl,program,buffer,uniforms={},raf=0,last=0,lastDraw=0,fpsLimit=60,dpr=1,pointMax=4;
let measuredStart=0,measuredFrames=0,colorTime=0,motionTime=0;
const grids=[[144,90],[240,146],[320,196]];
function message(text){error.textContent=text;error.hidden=!text;}
function syncUI(){for(const key of Object.keys(config)){
  if(choices[key]){document.getElementById(key).value=config[key];continue;}
  const value=key==='density'?config[key]:Math.round(config[key]*100);
  document.getElementById(key).value=value;
  document.getElementById(key+'-value').textContent=key==='density'?['低','中','高'][value]:value+'%';
}}
function setProperty(key,value){if(!Number.isFinite(value))return;config[key]=choices[key]?Math.round(clamp(value,0,choices[key].length-1)):key==='density'?Math.round(clamp(value,0,2)):clamp(value/100);syncUI();}
// Register synchronously at the end of body, independently of renderer startup.
window.wallpaperPropertyListener={
  applyUserProperties(properties){if(!properties)return;for(const key of Object.keys(config))if(properties[key])setProperty(key,Number(properties[key].value));},
  applyGeneralProperties(properties){if(properties&&Number.isFinite(properties.fps)){fpsLimit=clamp(properties.fps,1,144);lastDraw=0;}},
  setPaused(value){state.hostPaused=!!value;schedule();}
};
if(host)window.wallpaperRegisterAudioListener(data=>audio.receive(data,performance.now()));
const vertex=`
precision highp float;
attribute vec2 aUV;
uniform float uTime,uColorTime,uAspect,uDpr,uPointMax,uBass,uMid,uTreble,uEnergy,uSpread;
uniform mediump float uParticle;
uniform vec3 uWeights,uColorA,uColorB,uColorC,uColorD;
varying vec3 vColor;varying float vAlpha;varying float vStar;
float hash(vec2 p){vec3 h=fract(vec3(p.xyx)*vec3(123.34,456.21,345.45));h+=dot(h,h.yzx+45.32);return fract((h.x+h.y)*h.z);}
vec3 palette(float x){float v=fract(x)*3.;if(v<1.)return mix(uColorA,uColorB,smoothstep(0.,1.,v));if(v<2.)return mix(uColorB,uColorC,smoothstep(1.,2.,v));return mix(uColorC,uColorD,smoothstep(2.,3.,v));}
void main(){
 float t=uTime,s=hash(aUV+1.7),q=hash(aUV+8.2),n=hash(aUV+17.4),m=hash(aUV+29.1);
 float travel=fract(s+t*.018),x=(travel-.5)*24.;
 float strand=floor(q*3.)-1.,cross=fract(q*3.)-.5;
 float breath=1.+uBass*.85;
 // Independent seeded particles form moving volumes, never a rectangular grid.
 vec3 ribbon=vec3(x,1.65*sin(x*.24+t*.55+strand*.7)+.55*sin(x*.65-t*.48)+strand*1.1,1.9*cos(x*.2+t*.3+strand));
 ribbon.y+=cross*(.8+uSpread*1.8)*(.35+.65*sin(x*.3+t*.25)*sin(x*.3+t*.25));
 ribbon.z+=(n-.5)*(1.+uSpread*3.);
 ribbon.y+=uBass*sin(x*.7-t*2.4)*1.5+uMid*.45*sin(x*2.+n*5.+t);
 float radius=.45+pow(s,.7)*7.,arm=floor(q*3.);
 float angle=s*12.56637+arm*2.0944+t*.28+(n-.5)*(.3+uSpread*.4);
 radius+=(fract(q*3.)-.5)*.7;
 vec3 vortex=vec3(cos(angle)*radius,sin(angle)*radius*.64,(n-.5)*2.6+1.1*sin(angle*1.4+t*.4));
 vortex.xy*=1.+uBass*.5;vortex.z+=uMid*sin(angle*3.-t)*.8;
 float phi=s*6.283185,ct=q*2.-1.,st=sqrt(max(0.,1.-ct*ct)),rad=pow(n,.45);
 vec3 nebula=vec3(cos(phi)*st*rad*8.8,ct*rad*4.,sin(phi)*st*rad*3.8);
 nebula.y+=sin(nebula.x*.45+t*.4)*1.1;nebula.x+=sin(nebula.z*.6+t*.3)*1.4;
 nebula*=1.+uBass*.5;
 vec3 p=ribbon*uWeights.x+vortex*uWeights.y+nebula*uWeights.z;
 p.xy*=.85+uSpread*.4;
 float twist=.15*sin(t*.18)+uMid*.08,cs=cos(twist),sn=sin(twist);p.xy=mat2(cs,-sn,sn,cs)*p.xy;
 p.z+=sin(t*.15)*.7;
 // Airborne specks provide depth around the denser light streams.
 float dust=step(.88,m);vec3 air=vec3((s-.5)*25.,(q-.5)*13.,(n-.5)*7.);
 air.y+=sin(t*.3+s*6.)*.5;p=mix(p,air,dust*.88);
 float depth=max(5.,15.+p.z),focal=1.55;
 gl_Position=vec4(p.x*focal/uAspect,p.y*focal,depth*.98-.2,depth);
 float sparkle=pow(max(0.,sin(t*(.8+n)+s*81.)),14.);
 vStar=step(.982,n);
 float size=mix(1.35,2.4,q)+sparkle*.9+uTreble*(.8+vStar*4.);
 size+=uParticle>1.5?1.6:0.;size+=vStar*(uParticle>.5&&uParticle<1.5?4.:.8);
 gl_PointSize=clamp(size*15./depth*uDpr,1.,uPointMax);
 // Colour travels through each volume, rather than being pinned to screen X.
 float hue=s*.65+q*.28+sin(p.x*.22+p.y*.3-t*.17)*.19+uColorTime+uEnergy*.18;
 vColor=palette(hue);vColor=mix(vColor,vec3(.9,.95,1.),vStar*.45);
 float fade=smoothstep(0.,.06,travel)*smoothstep(0.,.06,1.-travel);
 vAlpha=(.23+q*.24+sparkle*.1+uEnergy*.13)*mix(1.,.2,dust)*fade;
}`;
const fragment=`
precision mediump float;
varying vec3 vColor;varying float vAlpha;varying float vStar;uniform float uBrightness,uParticle;
void main(){
  vec2 q=gl_PointCoord-.5;float r=length(q);
  float alpha=exp(-r*r*16.)*(1.-smoothstep(.38,.5,r));
  if(uParticle>1.5)alpha=exp(-pow((r-.28)*11.,2.))*.75*(1.-smoothstep(.42,.5,r));
  else if(uParticle>.5){float rays=exp(-abs(q.x)*35.)*exp(-abs(q.y)*5.)+exp(-abs(q.y)*35.)*exp(-abs(q.x)*5.);alpha+=rays*vStar*.5;}
  gl_FragColor=vec4(vColor*(.4+uBrightness*1.35),alpha*vAlpha);
}`;
function compile(type,source){const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);
  if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){const log=gl.getShaderInfoLog(shader);gl.deleteShader(shader);throw Error(log);}return shader;}
function rebuildGrid(){if(!gl||!program||state.lost)return;
  const [w,h]=grids[config.density],vertices=new Float32Array(w*h*2);
  for(let j=0;j<h;j++)for(let i=0;i<w;i++){const k=(j*w+i)*2;vertices[k]=i/(w-1);vertices[k+1]=j/(h-1);}
  gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,vertices,gl.STATIC_DRAW);state.drawCount=w*h;
}
function initialize(){
  try{
    // GLSL ES 1.00 avoids WebGL2-only gl_VertexID / VAO requirements.
    gl=canvas.getContext('webgl',{alpha:false,antialias:false,depth:false,stencil:false,powerPreference:'low-power'});
    if(!gl)throw Error('WebGL 不可用，请启用浏览器硬件加速并检查显卡驱动。');
    state.backend=gl.getParameter(gl.VERSION);pointMax=Math.min(16,gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE)[1]);
    program=gl.createProgram();const shaders=[compile(gl.VERTEX_SHADER,vertex),compile(gl.FRAGMENT_SHADER,fragment)];
    for(const shader of shaders)gl.attachShader(program,shader);gl.linkProgram(program);
    for(const shader of shaders)gl.deleteShader(shader);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    const loc=gl.getAttribLocation(program,'aUV');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
    for(const name of ['uTime','uColorTime','uAspect','uDpr','uPointMax','uBass','uMid','uTreble','uEnergy','uBrightness','uSpread','uParticle','uWeights','uColorA','uColorB','uColorC','uColorD'])uniforms[name]=gl.getUniformLocation(program,name);
    gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);gl.disable(gl.DEPTH_TEST);
    state.lost=false;rebuildGrid();resize();message('');schedule();
  }catch(e){message('画面初始化失败：'+e.message);}
}
function resize(){if(!gl||state.lost)return;
  // Cap DPR and total pixels: no offscreen passes or per-frame buffer uploads.
  dpr=Math.min(devicePixelRatio||1,1.5,Math.sqrt(3600000/Math.max(1,innerWidth*innerHeight)));
  canvas.width=Math.max(1,Math.round(innerWidth*dpr));canvas.height=Math.max(1,Math.round(innerHeight*dpr));
  gl.viewport(0,0,canvas.width,canvas.height);
}
function paused(){return state.userPaused||state.hostPaused||document.hidden||state.lost;}
function schedule(){cancelAnimationFrame(raf);raf=0;last=0;lastDraw=0;if(program&&!paused())raf=requestAnimationFrame(render);}
function render(now){
  raf=0;if(paused())return;raf=requestAnimationFrame(render);
  const interval=1000/fpsLimit;if(lastDraw&&now-lastDraw<interval-.5)return;
  const dt=last?Math.min(.1,(now-last)/1000):1/60;last=now;
  lastDraw=now-((now-lastDraw)%interval||0);
  state.time+=dt*(.18+config.velocity*.85);
  const values=audio.update(dt,now,state.demo,now/1000),strength=config.sensitivity;
  const scene=evolution.update(dt,config,values);
  motionTime+=dt*(.18+config.velocity*.85+scene.energy*1.1);
  colorTime+=dt*(.008+config.colorSpeed*.035+scene.energy*.07);
  gl.clearColor(.012,.018,.035,1);gl.clear(gl.COLOR_BUFFER_BIT);
  const data={uTime:motionTime,uColorTime:colorTime,uAspect:canvas.width/canvas.height,uDpr:dpr,uPointMax:pointMax,uBass:values[0]*strength,uMid:values[1]*strength,uTreble:values[2]*strength,uEnergy:scene.energy,uBrightness:config.brightness,uSpread:config.spread,uParticle:config.particle};
  for(const key of Object.keys(data))gl.uniform1f(uniforms[key],data[key]);
  gl.uniform3fv(uniforms.uWeights,scene.weights);
  for(let i=0;i<4;i++)gl.uniform3fv(uniforms[['uColorA','uColorB','uColorC','uColorD'][i]],scene.colors[i]);
  gl.drawArrays(gl.POINTS,0,state.drawCount);state.frames++;measuredFrames++;
  if(now-measuredStart>1000){state.fps=Math.round(measuredFrames*1000/(now-measuredStart));measuredFrames=0;measuredStart=now;
    document.getElementById('metrics').textContent=`${state.drawCount.toLocaleString()} PARTICLES / ${state.fps} FPS`;
    document.getElementById('status').textContent=state.demo?'◉ 模拟频谱 · 预览中':now-audio.last<500?'● Wallpaper Engine · 音频已连接':'● 舒缓流动 · 无音频输入';
  }
}
for(const key of Object.keys(config))document.getElementById(key).addEventListener(choices[key]?'change':'input',e=>{setProperty(key,Number(e.target.value));if(key==='density')rebuildGrid();});
// Host density updates need the same buffer rebuild as browser controls.
const apply=window.wallpaperPropertyListener.applyUserProperties;
window.wallpaperPropertyListener.applyUserProperties=p=>{const old=config.density;apply(p);if(old!==config.density)rebuildGrid();};
document.getElementById('demo').onclick=e=>{state.demo=!state.demo;e.currentTarget.setAttribute('aria-pressed',state.demo);e.currentTarget.textContent=state.demo?'◼ 停止模拟音乐':'▷ 模拟音乐预览';};
function toggleUI(){document.body.classList.toggle('hide-ui');if(document.body.classList.contains('hide-ui'))document.getElementById('reveal').focus();else document.getElementById('hide').focus();}
document.getElementById('hide').onclick=toggleUI;document.getElementById('reveal').onclick=toggleUI;
async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else message('此浏览器不支持全屏 API。');}catch(e){message('无法进入全屏：'+e.message);}}
function togglePause(){state.userPaused=!state.userPaused;const button=document.getElementById('pause');button.textContent=state.userPaused?'继续':'暂停';button.setAttribute('aria-pressed',state.userPaused);schedule();}
document.getElementById('fullscreen').onclick=fullscreen;document.getElementById('pause').onclick=togglePause;
document.addEventListener('keydown',e=>{if(e.target.matches('input,button,select,textarea')||e.ctrlKey||e.metaKey||e.altKey)return;if(e.key.toLowerCase()==='h')toggleUI();if(e.key.toLowerCase()==='f')fullscreen();if(e.code==='Space'){e.preventDefault();togglePause();}});
document.addEventListener('visibilitychange',schedule);window.addEventListener('resize',resize);
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();state.lost=true;schedule();message('图形上下文暂时中断，正在等待恢复…');});
canvas.addEventListener('webglcontextrestored',initialize);
// Read-only diagnostics for acceptance tests and hardware profiling.
window.chromaticFlow={snapshot:()=>({version:'0.3.0',...state,config:{...config},weights:[...evolution.weights],colors:evolution.colors.map(c=>[...c]),audio:[...audio.values],target:[...audio.target],resolution:[canvas.width,canvas.height],fpsLimit,glError:gl&&!state.lost?gl.getError():null})};
syncUI();initialize();
})();
