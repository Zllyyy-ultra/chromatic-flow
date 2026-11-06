(()=>{
'use strict';
const {AudioEnvelope,clamp}=window.FlowAudio;
const canvas=document.getElementById('scene'),error=document.getElementById('error');
const config={sensitivity:.65,velocity:.35,brightness:.6,density:1};
const audio=new AudioEnvelope();
const host=typeof window.wallpaperRegisterAudioListener==='function';
const state={demo:false,userPaused:false,hostPaused:false,lost:false,frames:0,time:0,fps:0,backend:'',drawCount:0};
if(host)document.body.classList.add('wallpaper');
if(new URLSearchParams(location.search).has('clean'))document.body.classList.add('hide-ui');
let gl,program,buffer,uniforms={},raf=0,last=0,lastDraw=0,fpsLimit=60,dpr=1,pointMax=4;
let measuredStart=0,measuredFrames=0;
const grids=[[144,90],[240,146],[320,196]];
function message(text){error.textContent=text;error.hidden=!text;}
function syncUI(){for(const key of Object.keys(config)){
  const value=key==='density'?config[key]:Math.round(config[key]*100);
  document.getElementById(key).value=value;
  document.getElementById(key+'-value').textContent=key==='density'?['低','中','高'][value]:value+'%';
}}
function setProperty(key,value){if(!Number.isFinite(value))return;config[key]=key==='density'?Math.round(clamp(value,0,2)):clamp(value/100);syncUI();}
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
uniform float uTime,uAspect,uDpr,uPointMax,uBass,uMid,uTreble,uEnergy;
varying vec3 vColor;
varying float vAlpha;
vec3 palette(float x){
  vec3 blue=vec3(.12,.35,.95),purple=vec3(.52,.25,.93),pink=vec3(.94,.28,.53),gold=vec3(1.,.64,.27),teal=vec3(.12,.84,.77);
  float t=clamp(x,0.,1.);
  if(t<.25)return mix(blue,purple,smoothstep(0.,.25,t));
  if(t<.5)return mix(purple,pink,smoothstep(.25,.5,t));
  if(t<.75)return mix(pink,gold,smoothstep(.5,.75,t));
  return mix(gold,teal,smoothstep(.75,1.,t));
}
void main(){
  float t=uTime;vec2 p=(aUV-.5)*vec2(23.,17.);
  float h=.72*sin(p.x*.53+t*.48)*cos(p.y*.4-t*.23);
  h+=.34*sin(p.x*.88+p.y*.62-t*.42)+.18*cos(p.y*1.2-t*.36);
  float r=length(p-vec2(sin(t*.18)*2.,0.));
  h+=uBass*1.55*sin(r*1.4-t*2.8)*exp(-r*.08);
  h+=uMid*.36*sin(p.x*1.8+p.y*.9-t*1.6);
  h+=uTreble*.08*sin(p.x*7.+p.y*6.+t*2.);
  // Real perspective: tilt the XZ surface around X, then project from a camera.
  float y=h*.84-p.y*.54-.9;
  float depth=15.+p.y*.84+h*.54;
  float focal=1.65;
  gl_Position=vec4(p.x*focal/uAspect,y*focal,depth*.98-.2,depth);
  float sparkle=pow(max(0.,sin(aUV.x*1651.+aUV.y*923.+t*.7)),20.);
  gl_PointSize=clamp((1.65+sparkle*.8+uTreble*.65)*15./depth*uDpr,1.,uPointMax);
  float hue=aUV.x*.76+aUV.y*.22+h*.035+.055*sin(t*.08)+uEnergy*.025;
  vColor=palette(hue);
  float edge=smoothstep(0.,.085,aUV.x)*smoothstep(0.,.085,1.-aUV.x)*smoothstep(0.,.09,aUV.y)*smoothstep(0.,.1,1.-aUV.y);
  vAlpha=clamp((.52+.18*h+sparkle*.3)*edge,0.,.88);
}`;
const fragment=`
precision mediump float;
varying vec3 vColor;varying float vAlpha;uniform float uBrightness;
void main(){
  float r=length(gl_PointCoord-.5);
  float alpha=1.-smoothstep(.12,.5,r);
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
    state.backend=gl.getParameter(gl.VERSION);pointMax=Math.min(8,gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE)[1]);
    program=gl.createProgram();const shaders=[compile(gl.VERTEX_SHADER,vertex),compile(gl.FRAGMENT_SHADER,fragment)];
    for(const shader of shaders)gl.attachShader(program,shader);gl.linkProgram(program);
    for(const shader of shaders)gl.deleteShader(shader);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    const loc=gl.getAttribLocation(program,'aUV');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
    for(const name of ['uTime','uAspect','uDpr','uPointMax','uBass','uMid','uTreble','uEnergy','uBrightness'])uniforms[name]=gl.getUniformLocation(program,name);
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
  gl.clearColor(.027,.035,.065,1);gl.clear(gl.COLOR_BUFFER_BIT);
  const data={uTime:state.time,uAspect:canvas.width/canvas.height,uDpr:dpr,uPointMax:pointMax,uBass:values[0]*strength,uMid:values[1]*strength,uTreble:values[2]*strength,uEnergy:(values[0]*.5+values[1]*.35+values[2]*.15)*strength,uBrightness:config.brightness};
  for(const key of Object.keys(data))gl.uniform1f(uniforms[key],data[key]);
  gl.drawArrays(gl.POINTS,0,state.drawCount);state.frames++;measuredFrames++;
  if(now-measuredStart>1000){state.fps=Math.round(measuredFrames*1000/(now-measuredStart));measuredFrames=0;measuredStart=now;
    document.getElementById('metrics').textContent=`${state.drawCount.toLocaleString()} PARTICLES / ${state.fps} FPS`;
    document.getElementById('status').textContent=state.demo?'◉ 模拟频谱 · 预览中':now-audio.last<500?'● Wallpaper Engine · 音频已连接':'● 舒缓流动 · 无音频输入';
  }
}
for(const key of Object.keys(config))document.getElementById(key).addEventListener('input',e=>{setProperty(key,Number(e.target.value));if(key==='density')rebuildGrid();});
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
window.chromaticFlow={snapshot:()=>({version:'0.2.0',...state,config:{...config},audio:[...audio.values],target:[...audio.target],resolution:[canvas.width,canvas.height],fpsLimit,glError:gl&&!state.lost?gl.getError():null})};
initialize();
})();
