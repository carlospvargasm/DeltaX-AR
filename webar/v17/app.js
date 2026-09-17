const video=document.querySelector('#camera');
const canvas=document.querySelector('#captureCanvas');
const start=document.querySelector('#start');
const permission=document.querySelector('#permission');
const flip=document.querySelector('#flip');
const capture=document.querySelector('#capture');
const preview=document.querySelector('#preview');
const photo=document.querySelector('#photo');
const retake=document.querySelector('#retake');
const save=document.querySelector('#save');
const title=document.querySelector('#title');
const copy=document.querySelector('#copy');
const mascot=document.querySelector('#mascot');
const dots=[...document.querySelectorAll('[data-slide]')];
let stream=null;
let facing='environment';
let slide=0;
const scenes=[
 {title:'El valor invisible está aquí',copy:'Mueve tu cámara y descubre cómo el campo puede conectar con nuevas oportunidades.'},
 {title:'Medimos lo que el campo genera',copy:'Tecnología, evidencia y territorio para dar valor a prácticas agrícolas que protegen el planeta.'},
 {title:'Del territorio a mercados en el mundo',copy:'DeltaX conecta agricultores y sus familias con nuevas oportunidades ambientales y productivas.'}
];
async function openCamera(){
 if(stream) stream.getTracks().forEach(t=>t.stop());
 try{
   stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:facing},width:{ideal:1920},height:{ideal:1080}},audio:false});
   video.srcObject=stream; await video.play(); permission.hidden=true;
 }catch(e){
   permission.hidden=false;
   permission.querySelector('p').textContent='No fue posible acceder a la cámara. Revisa el permiso del navegador y vuelve a intentarlo.';
 }
}
start.addEventListener('click',openCamera);
flip.addEventListener('click',async()=>{facing=facing==='environment'?'user':'environment';await openCamera();});
function drawCover(ctx,vid,w,h){
 const vw=vid.videoWidth,vh=vid.videoHeight;if(!vw||!vh)return;
 const scale=Math.max(w/vw,h/vh),sw=w/scale,sh=h/scale,sx=(vw-sw)/2,sy=(vh-sh)/2;
 if(facing==='user'){ctx.save();ctx.translate(w,0);ctx.scale(-1,1);ctx.drawImage(vid,sx,sy,sw,sh,0,0,w,h);ctx.restore();}
 else ctx.drawImage(vid,sx,sy,sw,sh,0,0,w,h);
}
async function snap(){
 if(!stream)return;
 const w=window.innerWidth*devicePixelRatio,h=window.innerHeight*devicePixelRatio;
 canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d');drawCover(ctx,video,w,h);
 const rect=mascot.getBoundingClientRect();
 try{await mascot.decode();ctx.drawImage(mascot,rect.left*devicePixelRatio,rect.top*devicePixelRatio,rect.width*devicePixelRatio,rect.height*devicePixelRatio);}catch(e){}
 const data=canvas.toDataURL('image/jpeg',.92);photo.src=data;save.href=data;preview.hidden=false;
}
capture.addEventListener('click',snap);retake.addEventListener('click',()=>preview.hidden=true);
function renderScene(n){slide=(n+scenes.length)%scenes.length;title.textContent=scenes[slide].title;copy.textContent=scenes[slide].copy;dots.forEach((d,i)=>d.classList.toggle('active',i===slide));mascot.animate([{transform:'translateY(8px) scale(.94)',opacity:.3},{transform:'translateY(0) scale(1)',opacity:1}],{duration:520,easing:'ease-out'});}
document.querySelector('#next').addEventListener('click',()=>renderScene(slide+1));document.querySelector('#previous').addEventListener('click',()=>renderScene(slide-1));dots.forEach((d,i)=>d.addEventListener('click',()=>renderScene(i)));
window.addEventListener('orientationchange',()=>setTimeout(()=>renderScene(slide),120));
window.addEventListener('pagehide',()=>{if(stream)stream.getTracks().forEach(t=>t.stop())});
renderScene(0);