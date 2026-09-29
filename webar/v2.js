const $=s=>document.querySelector(s);
const app=$('#app'),video=$('#camera'),start=$('#start'),cameraBtn=$('#selfie'),shutterBtn=$('#shutter'),record=$('#record'),capture=$('#captureCanvas'),notice=$('#captureNotice'),statusEl=$('#status'),instruction=$('#instruction'),recordTimer=$('#recordTimer');
let stream=null,facing='environment',recorder=null,chunks=[],raf=0,timerId=0,recordStarted=0;

function msg(t){notice.textContent=t;notice.classList.remove('hidden');setTimeout(()=>notice.classList.add('hidden'),1800)}
function label(){cameraBtn.querySelector('b').textContent=facing==='user'?'Trasera':'Frontal'}
function setState(on){app.dataset.state=on?'camera':'welcome';instruction.textContent=on?(facing==='user'?'Cámara frontal':'Cámara trasera'):'Activa la cámara para comenzar';start.querySelector('b').textContent=on?'DESACTIVAR CÁMARA':'ACTIVAR CÁMARA';app.classList.toggle('selfie-mode',on&&facing==='user');label()}
async function openCamera(){try{if(stream)stream.getTracks().forEach(t=>t.stop());stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:facing},width:{ideal:1280},height:{ideal:720}},audio:false});video.srcObject=stream;await video.play();setState(true);statusEl.textContent=facing==='user'?'Frontal activa':'Trasera activa'}catch(e){msg('REVISA EL PERMISO DE CÁMARA')}}
function stopCamera(){if(stream)stream.getTracks().forEach(t=>t.stop());stream=null;video.srcObject=null;facing='environment';setState(false);statusEl.textContent='Cámara desactivada'}
start.disabled=false;start.onclick=()=>stream?stopCamera():openCamera();
cameraBtn.onclick=async()=>{facing=facing==='environment'?'user':'environment';await openCamera()};

function shutter(){try{const A=window.AudioContext||window.webkitAudioContext,a=new A(),o=a.createOscillator(),g=a.createGain();o.frequency.value=125;g.gain.value=.14;o.connect(g);g.connect(a.destination);o.start();g.gain.exponentialRampToValueAtTime(.001,a.currentTime+.08);o.stop(a.currentTime+.08)}catch(e){}}
function frame(){
 const d=Math.min(2,devicePixelRatio||1),W=Math.round(innerWidth*d),H=Math.round(innerHeight*d);capture.width=W;capture.height=H;
 const c=capture.getContext('2d'),vw=video.videoWidth||1280,vh=video.videoHeight||720,k=Math.max(W/vw,H/vh),sw=W/k,sh=H/k;
 c.save();if(facing==='user'){c.translate(W,0);c.scale(-1,1)}c.drawImage(video,(vw-sw)/2,(vh-sh)/2,sw,sh,0,0,W,H);c.restore();
 c.save();c.scale(d,d);c.fillStyle='rgba(0,0,0,.18)';c.beginPath();c.arc(38,38,27,0,Math.PI*2);c.fill();c.fillStyle='#fff';c.font='900 30px Arial';c.textAlign='center';c.textBaseline='middle';c.fillText('ΔX',38,39);
 document.querySelectorAll('.bird').forEach(el=>{const im=el.querySelector('img'),r=el.getBoundingClientRect();if(im&&im.complete&&im.naturalWidth&&r.right>0&&r.left<innerWidth&&r.bottom>0&&r.top<innerHeight)c.drawImage(im,r.left,r.top,r.width,r.height)});c.restore();
}
async function share(blob,name){const file=new File([blob],name,{type:blob.type});if(navigator.share&&navigator.canShare?.({files:[file]})){try{await navigator.share({files:[file],title:'DeltaX Panamá'});return}catch(e){if(e.name==='AbortError')return}}const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),3000)}

async function takePhoto(){if(!stream){msg('ACTIVA LA CÁMARA');return}shutter();frame();capture.toBlob(async b=>{if(b){msg('FOTO LISTA');await share(b,'DeltaX-Panama-'+Date.now()+'.jpg')}},'image/jpeg',.92)}
shutterBtn.onclick=takePhoto;

record.onclick=()=>{if(!stream){msg('ACTIVA LA CÁMARA');return}if(recorder?.state==='recording'){recorder.stop();return}if(!window.MediaRecorder||!capture.captureStream){msg('VIDEO NO COMPATIBLE');return}
 chunks=[];const out=capture.captureStream(30),types=['video/mp4;codecs=avc1.42E01E','video/mp4','video/webm;codecs=vp8','video/webm'],mime=types.find(t=>MediaRecorder.isTypeSupported(t))||'';
 try{recorder=new MediaRecorder(out,mime?{mimeType:mime}:undefined)}catch(e){msg('VIDEO NO COMPATIBLE');return}
 recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
 recorder.onstop=async()=>{cancelAnimationFrame(raf);clearInterval(timerId);recordTimer.textContent='00:00';recordTimer.classList.remove('show');const type=recorder.mimeType||mime||'video/webm',blob=new Blob(chunks,{type}),mp4=type.includes('mp4');record.classList.remove('recording');record.querySelector('b').textContent='Video';if(!mp4)msg('FORMATO WEBM: WHATSAPP PUEDE NO ACEPTARLO');await share(blob,'DeltaX-Panama-'+Date.now()+(mp4?'.mp4':'.webm'))};
 const draw=()=>{frame();raf=requestAnimationFrame(draw)};draw();recorder.start(500);recordStarted=Date.now();recordTimer.textContent='00:00';recordTimer.classList.add('show');clearInterval(timerId);timerId=setInterval(()=>{const s=Math.floor((Date.now()-recordStarted)/1000),m=Math.floor(s/60),ss=s%60;recordTimer.textContent=String(m).padStart(2,'0')+':'+String(ss).padStart(2,'0')},250);record.classList.add('recording');record.querySelector('b').textContent='Detener';msg('GRABANDO')};
window.addEventListener('beforeunload',()=>{if(stream)stream.getTracks().forEach(t=>t.stop());cancelAnimationFrame(raf)});