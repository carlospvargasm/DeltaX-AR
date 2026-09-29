const $=s=>document.querySelector(s);
const app=$('#app'),video=$('#camera'),start=$('#start'),cameraBtn=$('#selfie'),shutterBtn=$('#shutter'),recordBtn=$('#record'),capture=$('#captureCanvas'),notice=$('#captureNotice'),statusEl=$('#status'),instruction=$('#instruction'),recordTimer=$('#recordTimer');
let stream=null,facing='environment',recorder=null,chunks=[],raf=0,timerId=0,recordStarted=0,lastBlob=null,lastName='',lastKind='';

function msg(t){notice.textContent=t;notice.classList.remove('hidden');setTimeout(()=>notice.classList.add('hidden'),1800)}
function updateCameraLabel(){cameraBtn.querySelector('b').textContent=facing==='user'?'Trasera':'Frontal'}
function state(on){app.dataset.state=on?'camera':'welcome';app.classList.toggle('selfie-mode',on&&facing==='user');instruction.textContent=on?(facing==='user'?'Cámara frontal activa':'Cámara trasera activa'):'Activa la cámara para comenzar';start.querySelector('b').textContent=on?'DESACTIVAR CÁMARA':'ACTIVAR CÁMARA';updateCameraLabel()}
async function openCamera(){try{if(stream)stream.getTracks().forEach(t=>t.stop());stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{exact:facing},width:{ideal:1280},height:{ideal:720}},audio:false});video.srcObject=stream;await video.play();state(true);statusEl.textContent=facing==='user'?'Frontal activa':'Trasera activa'}catch(e){try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:facing},audio:false});video.srcObject=stream;await video.play();state(true)}catch(_){msg('NO SE PUDO CAMBIAR LA CÁMARA')}}}
function stopCamera(){if(stream)stream.getTracks().forEach(t=>t.stop());stream=null;video.srcObject=null;facing='environment';state(false)}
start.disabled=false;start.onclick=()=>stream?stopCamera():openCamera();
cameraBtn.onclick=async()=>{facing=facing==='environment'?'user':'environment';await openCamera()};

let shutterAudio=null;
async function clickSound(){
  try{
    const A=window.AudioContext||window.webkitAudioContext;
    if(!A)return;
    shutterAudio=shutterAudio||new A();
    if(shutterAudio.state==='suspended')await shutterAudio.resume();
    const t=shutterAudio.currentTime;
    const buffer=shutterAudio.createBuffer(1,Math.floor(shutterAudio.sampleRate*.075),shutterAudio.sampleRate);
    const data=buffer.getChannelData(0);
    for(let i=0;i<data.length;i++){
      const x=i/data.length;
      data[i]=(Math.random()*2-1)*Math.exp(-x*13)*(i<180?1:.32);
    }
    const src=shutterAudio.createBufferSource(),filter=shutterAudio.createBiquadFilter(),gain=shutterAudio.createGain();
    filter.type='bandpass';filter.frequency.value=2400;filter.Q.value=.7;
    gain.gain.setValueAtTime(.38,t);gain.gain.exponentialRampToValueAtTime(.001,t+.075);
    src.buffer=buffer;src.connect(filter);filter.connect(gain);gain.connect(shutterAudio.destination);src.start(t);
  }catch(e){}
}
function frame(){const d=Math.min(2,devicePixelRatio||1),W=Math.round(innerWidth*d),H=Math.round(innerHeight*d);capture.width=W;capture.height=H;const c=capture.getContext('2d'),vw=video.videoWidth||1280,vh=video.videoHeight||720,k=Math.max(W/vw,H/vh),sw=W/k,sh=H/k;c.save();if(facing==='user'){c.translate(W,0);c.scale(-1,1)}c.drawImage(video,(vw-sw)/2,(vh-sh)/2,sw,sh,0,0,W,H);c.restore();c.save();c.scale(d,d);c.fillStyle='rgba(0,0,0,.18)';c.beginPath();c.arc(38,38,27,0,Math.PI*2);c.fill();c.fillStyle='#fff';c.font='900 30px Arial';c.textAlign='center';c.textBaseline='middle';c.fillText('ΔX',38,39);document.querySelectorAll('.bird').forEach(el=>{const im=el.querySelector('img'),r=el.getBoundingClientRect();if(im&&im.complete&&im.naturalWidth&&r.right>0&&r.left<innerWidth&&r.bottom>0&&r.top<innerHeight)c.drawImage(im,r.left,r.top,r.width,r.height)});c.restore()}
shutterBtn.onclick=async()=>{if(!stream){msg('ACTIVA LA CÁMARA');return}await clickSound();shutterBtn.classList.add('flash');setTimeout(()=>shutterBtn.classList.remove('flash'),130);frame();capture.toBlob(b=>{if(!b)return;lastBlob=b;lastName='DeltaX-Panama-'+Date.now()+'.jpg';lastKind='foto';msg('SELFIE GUARDADA')},'image/jpeg',.94)};


recordBtn.onclick=()=>{if(!stream){msg('ACTIVA LA CÁMARA');return}if(recorder?.state==='recording'){recorder.stop();return}if(!window.MediaRecorder||!capture.captureStream){msg('VIDEO NO COMPATIBLE');return}chunks=[];const out=capture.captureStream(30),types=['video/mp4;codecs=avc1.42E01E','video/mp4','video/webm;codecs=vp8','video/webm'],mime=types.find(t=>MediaRecorder.isTypeSupported(t))||'';try{recorder=new MediaRecorder(out,mime?{mimeType:mime}:undefined)}catch(e){msg('VIDEO NO COMPATIBLE');return}recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};recorder.onstop=()=>{cancelAnimationFrame(raf);clearInterval(timerId);const type=recorder.mimeType||mime||'video/webm',mp4=type.includes('mp4');lastBlob=new Blob(chunks,{type});lastName='DeltaX-Panama-'+Date.now()+(mp4?'.mp4':'.webm');lastKind='video';recordBtn.classList.remove('recording');recordBtn.querySelector('b').textContent='REC';recordTimer.textContent='00:00';recordTimer.classList.remove('show');msg(mp4?'VIDEO GUARDADO':'VIDEO WEBM GUARDADO')};const draw=()=>{frame();raf=requestAnimationFrame(draw)};draw();recorder.start(500);recordStarted=Date.now();recordTimer.textContent='00:00';recordTimer.classList.add('show');clearInterval(timerId);timerId=setInterval(()=>{const s=Math.floor((Date.now()-recordStarted)/1000);recordTimer.textContent=String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')},250);recordBtn.classList.add('recording');recordBtn.querySelector('b').textContent='Detener';msg('GRABANDO')};
window.addEventListener('beforeunload',()=>{if(stream)stream.getTracks().forEach(t=>t.stop());clearInterval(timerId);cancelAnimationFrame(raf)});