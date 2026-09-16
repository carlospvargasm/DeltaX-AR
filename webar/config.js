window.DELTAX_SCENES = [
 {id:1,title:'DESCUBRIR',sub:'Suelo · Agua · Cultivo · Prácticas',action:'discover'},
 {id:2,title:'CERRAR LA BRECHA',sub:'Datos → Evidencia → Oportunidades',action:'bridge'},
 {id:3,title:'CONECTAR',sub:'Cooperativas · Familias · Comunidades · Compradores',action:'connect'},
 {id:4,title:'HACER VISIBLE',sub:'Evidencia local → Marketplace DeltaX',action:'market'},
 {id:5,title:'REPLICAR',sub:'La evidencia puede crecer más allá del territorio',action:'expand'},
 {id:6,title:'YA ESTÁ OCURRIENDO',sub:'25 organizaciones · 1.721 productores · 675 mujeres · 181 jóvenes',action:'pulse'},
 {id:7,title:'MODELO DE NEGOCIO',sub:'Valor ambiental → mercado',action:'value'},
 {id:8,title:'SAN CARLOS DOS',sub:'Cada dato tiene una historia',action:'human'},
 {id:9,title:'DAR VALOR',sub:'Evidencia → tCO₂e → Crédito de Carbono → Marketplace → Mundo',action:'world'},
 {id:10,title:'LA SIGUIENTE ETAPA',sub:'Cada historia tiene un valor',action:'future'},
 {id:11,title:'CADA HISTORIA TIENE UN VALOR',sub:'DeltaX ayuda al mundo a descubrirlo',action:'final'}
];
window.DELTAX_TRACKING={targets:DELTAX_SCENES.map(s=>({scene:s.id,src:`assets/markers/lamina${String(s.id).padStart(2,'0')}.jpg`})),maxFeatures:1100,matchDistance:46,minGoodMatches:22,minLead:5,confirmFrames:2,scanEveryMs:420};