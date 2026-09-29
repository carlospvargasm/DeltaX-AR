const q=s=>document.querySelector(s);
const app=q('#app'),video=q('#camera'),canvas=q('#captureCanvas'),start=q('#start'),cameraSwitch=q('#cameraSwitch'),shutter=q('#shutter'),record=q('#record'),timer=q('#recordTimer'),notice=q('#notice'),instruction=q('#instruction');
let stream=null,facing='environment',recorder=null,chunks=[],raf=0,timerId=0,started=0,audioCtx=null;

function say(t){notice.textContent=t;notice.classList.add('show');setTimeout(()=>notice.classList.remove('show'),1400)}
function label(){cameraSwitch.querySelector('b').textContent=facing==='user'?'Trasera':'Frontal'}
async function camera(){
  try{
    if(stream)stream.getTracks().forEach(x=>x.stop());
    stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:facing,width:{ideal:1280},height:{ideal:720}},audio:false});
    video.srcObject=stream;await video.play();
    app.dataset.state='camera';app.classList.toggle('front',facing==='user');label();
    instruction.textContent=facing==='user'?'Cámara frontal activa':'Cámara trasera activa';
    start.textContent='DESACTIVAR CÁMARA';
  }catch(e){say('NO SE PUDO ACTIVAR LA CÁMARA')}
}
function stopCamera(){if(stream)stream.getTracks().forEach(x=>x.stop());stream=null;video.srcObject=null;facing='environment';app.dataset.state='welcome';app.classList.remove('front');label();instruction.textContent='Activa la cámara para comenzar';start.textContent='ACTIVAR CÁMARA'}
start.onclick=()=>stream?stopCamera():camera();
cameraSwitch.onclick=async()=>{facing=facing==='environment'?'user':'environment';await camera()};

async function shutterSound(){
  try{
    const A=window.AudioContext||window.webkitAudioContext;if(!A)return;
    audioCtx=audioCtx||new A();if(audioCtx.state==='suspended')await audioCtx.resume();
    const t=audioCtx.currentTime;
    function mechanical(at,duration,frequency,gainValue){
      const n=Math.max(1,Math.floor(audioCtx.sampleRate*duration)),b=audioCtx.createBuffer(1,n,audioCtx.sampleRate),d=b.getChannelData(0);
      for(let i=0;i<n;i++){const x=i/n;d[i]=(Math.random()*2-1)*Math.exp(-x*24)}
      const s=audioCtx.createBufferSource(),f=audioCtx.createBiquadFilter(),g=audioCtx.createGain();
      f.type='bandpass';f.frequency.value=frequency;f.Q.value=1.1;g.gain.setValueAtTime(gainValue,at);g.gain.exponentialRampToValueAtTime(.001,at+duration);
      s.buffer=b;s.connect(f);f.connect(g);g.connect(audioCtx.destination);s.start(at)
    }
    mechanical(t,.028,1900,.32);
    mechanical(t+.072,.040,1250,.42);
    mechanical(t+.118,.022,2300,.18);
  }catch(e){}
}
function drawFrame(){
  const d=Math.min(2,devicePixelRatio||1),W=Math.round(innerWidth*d),H=Math.round(innerHeight*d);
  canvas.width=W;canvas.height=H;const c=canvas.getContext('2d'),vw=video.videoWidth||1280,vh=video.videoHeight||720,k=Math.max(W/vw,H/vh),sw=W/k,sh=H/k;
  c.save();if(facing==='user'){c.translate(W,0);c.scale(-1,1)}c.drawImage(video,(vw-sw)/2,(vh-sh)/2,sw,sh,0,0,W,H);c.restore();
  c.save();c.scale(d,d);
  c.fillStyle='rgba(0,0,0,.20)';c.beginPath();c.arc(38,38,27,0,Math.PI*2);c.fill();c.fillStyle='#fff';c.font='900 29px Arial';c.textAlign='center';c.textBaseline='middle';c.fillText('ΔX',38,39);
  document.querySelectorAll('.bird').forEach(el=>{const im=el.querySelector('img'),r=el.getBoundingClientRect();if(im?.complete&&im.naturalWidth&&r.right>0&&r.left<innerWidth&&r.bottom>0&&r.top<innerHeight)c.drawImage(im,r.left,r.top,r.width,r.height)});
  c.restore()
}
shutter.onclick=async()=>{if(!stream){say('ACTIVA LA CÁMARA');return}await shutterSound();shutter.classList.add('pressed');setTimeout(()=>shutter.classList.remove('pressed'),100);drawFrame();canvas.toBlob(b=>{if(!b)return;const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='DeltaX-Panama-'+Date.now()+'.jpg';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2500);say('SELFIE GUARDADA')},'image/jpeg',.94)};

record.onclick=()=>{
  if(!stream){say('ACTIVA LA CÁMARA');return}
  if(recorder?.state==='recording'){recorder.stop();return}
  if(!window.MediaRecorder||!canvas.captureStream){say('VIDEO NO COMPATIBLE');return}
  chunks=[];const out=canvas.captureStream(30),types=['video/mp4;codecs=avc1.42E01E','video/mp4','video/webm;codecs=vp8','video/webm'],mime=types.find(x=>MediaRecorder.isTypeSupported(x))||'';
  try{recorder=new MediaRecorder(out,mime?{mimeType:mime}:undefined)}catch(e){say('VIDEO NO COMPATIBLE');return}
  recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
  recorder.onstop=()=>{cancelAnimationFrame(raf);clearInterval(timerId);record.classList.remove('recording');record.querySelector('b').textContent='REC';timer.classList.remove('show');timer.textContent='00:00';const type=recorder.mimeType||mime||'video/webm',blob=new Blob(chunks,{type}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='DeltaX-Panama-'+Date.now()+(type.includes('mp4')?'.mp4':'.webm');a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2500);say('VIDEO GUARDADO')};
  const loop=()=>{drawFrame();raf=requestAnimationFrame(loop)};loop();recorder.start(400);started=Date.now();record.classList.add('recording');record.querySelector('b').textContent='DETENER';timer.classList.add('show');
  timerId=setInterval(()=>{const s=Math.floor((Date.now()-started)/1000);timer.textContent=String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')},250)
};
window.addEventListener('beforeunload',()=>{if(stream)stream.getTracks().forEach(x=>x.stop());clearInterval(timerId);cancelAnimationFrame(raf)});