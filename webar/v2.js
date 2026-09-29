const $=s=>document.querySelector(s);
const app=$('#app'),video=$('#camera'),start=$('#start'),selfie=$('#selfie'),photo=$('#photo'),record=$('#record'),capture=$('#captureCanvas'),noticeEl=$('#captureNotice'),statusEl=$('#status'),instruction=$('#instruction');
let stream=null,facing='environment',recorder=null,chunks=[],raf=0;

function msg(t){noticeEl.textContent=t;noticeEl.classList.remove('hidden');setTimeout(()=>noticeEl.classList.add('hidden'),1800)}
function state(s){app.dataset.state=s;if(s==='welcome'){instruction.textContent='Activa la cámara para comenzar';start.querySelector('b').textContent='ACTIVAR CÁMARA'}else{instruction.textContent=facing==='user'?'Modo selfie activo':'Cámara activa';start.querySelector('b').textContent='DESACTIVAR CÁMARA'}}
async function openCamera(){
  try{
    if(stream)stream.getTracks().forEach(t=>t.stop());
    stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:facing},width:{ideal:1280},height:{ideal:720}},audio:false});
    video.srcObject=stream;await video.play();
    app.classList.toggle('selfie-mode',facing==='user');
    selfie.querySelector('b').textContent=facing==='user'?'Trasera':'Selfie';
    state('camera');statusEl.textContent=facing==='user'?'Selfie activa':'Cámara trasera activa';
  }catch(e){statusEl.textContent='No se pudo abrir la cámara';msg('REVISA EL PERMISO DE CÁMARA')}
}
function cameraOff(){if(stream)stream.getTracks().forEach(t=>t.stop());stream=null;video.srcObject=null;app.classList.remove('selfie-mode');facing='environment';selfie.querySelector('b').textContent='Selfie';state('welcome');statusEl.textContent='Cámara desactivada'}
start.disabled=false;
start.onclick=()=>stream?cameraOff():openCamera();
selfie.onclick=async()=>{facing=facing==='environment'?'user':'environment';if(stream)await openCamera();else{app.classList.toggle('selfie-mode',facing==='user');selfie.querySelector('b').textContent=facing==='user'?'Trasera':'Selfie';await openCamera()}};

function captureFrame(){
 const dpr=Math.min(2,devicePixelRatio||1),W=Math.round(innerWidth*dpr),H=Math.round(innerHeight*dpr);capture.width=W;capture.height=H;
 const c=capture.getContext('2d'),vw=video.videoWidth||1280,vh=video.videoHeight||720,scale=Math.max(W/vw,H/vh),sw=W/scale,sh=H/scale;
 c.save();
 if(facing==='user'){c.translate(W,0);c.scale(-1,1)}
 c.drawImage(video,(vw-sw)/2,(vh-sh)/2,sw,sh,0,0,W,H);c.restore();
 c.save();c.scale(dpr,dpr);
 // Selfie final: solo icono DeltaX + mascota, sin textos ni datos de slides.
 c.fillStyle='rgba(0,0,0,.18)';c.beginPath();c.arc(38,38,27,0,Math.PI*2);c.fill();
 c.fillStyle='#fff';c.font='900 30px Arial';c.textAlign='center';c.textBaseline='middle';c.fillText('ΔX',38,39);
 const birds=[...document.querySelectorAll('.bird')];
 birds.forEach(el=>{
   const img=el.querySelector('img');if(!img||!img.complete||!img.naturalWidth)return;
   const r=el.getBoundingClientRect();if(r.right<0||r.left>innerWidth||r.bottom<0||r.top>innerHeight)return;
   c.save();
   const flipped=getComputedStyle(el).transform!=='none' && el.classList.contains('bird-b');
   if(flipped){c.translate(r.left+r.width,r.top);c.scale(-1,1);c.drawImage(img,0,0,r.width,r.height)}
   else c.drawImage(img,r.left,r.top,r.width,r.height);
   c.restore();
 });
 c.restore();
}
photo.onclick=()=>{if(!stream){msg('ACTIVA LA CÁMARA');return}captureFrame();capture.toBlob(blob=>{const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='DeltaX-Panama-'+Date.now()+'.jpg';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000);msg('FOTO GUARDADA')},'image/jpeg',.94)};
record.onclick=()=>{if(!stream){msg('ACTIVA LA CÁMARA');return}if(recorder&&recorder.state==='recording'){recorder.stop();return}if(!window.MediaRecorder||!capture.captureStream){msg('VIDEO NO COMPATIBLE');return}chunks=[];const out=capture.captureStream(30);recorder=new MediaRecorder(out);recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};recorder.onstop=()=>{cancelAnimationFrame(raf);const blob=new Blob(chunks,{type:recorder.mimeType||'video/webm'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='DeltaX-Panama-'+Date.now()+'.webm';a.click();record.classList.remove('recording');record.querySelector('b').textContent='Video';msg('VIDEO GUARDADO')};const draw=()=>{captureFrame();raf=requestAnimationFrame(draw)};draw();recorder.start(500);record.classList.add('recording');record.querySelector('b').textContent='Detener';msg('GRABANDO')};
window.addEventListener('beforeunload',()=>{if(stream)stream.getTracks().forEach(t=>t.stop());if(raf)cancelAnimationFrame(raf)});