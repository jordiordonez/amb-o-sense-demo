/* Amb o sense · v4. L'estat viu al navegador (memòria i sessionStorage de la pestanya):
   les tries i el test no s'envien enlloc. */
(function(){
"use strict";
const D = window.DATA;
const $ = (s,el=document)=>el.querySelector(s);
const $$ = (s,el=document)=>[...el.querySelectorAll(s)];
const esc = s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const tema = id=>D.temes.find(t=>t.id===id);
const preg = id=>D.preguntes.find(q=>q.id===id);
const pregsDe = id=>D.preguntes.filter(q=>q.tema===id);
const actius = ()=>D.temes.filter(t=>t.actiu);

/* ---------- Estat ----------
   tria: pregunta → "amb" | "sense" (què l'afavoreix més). Només compta el recompte, sense pesos.
   flux: sèries de 5 preguntes del recorregut principal.
   us: comptadors per al senyal anònim d'ús (vegeu «Senyal anònim»). */
const STORE = "amb-o-sense-v4";
const novaPartida = ()=>({encerts:0, preguntes:0, ratxa:0, hist:[]});
const nouEstat = ()=>({
  tria:{}, flux:{fetes:[], actual:null, saltades:{}},
  // Test: la partida acumula les tandes fins que es reinicia; les acabades queden a «anteriors».
  test:{tanda:null, vistes:{}, perTema:{}, millor:0, partida:novaPartida(), anteriors:[]},
  us:{detall:0, fonts:0, balanc:0, temes:0, inici:Date.now()},
  senyal:true
});
let S = nouEstat();
try{const j=JSON.parse(sessionStorage.getItem(STORE)||"null");if(j&&j.flux&&j.test)S=Object.assign(nouEstat(),j);if(!S.test.partida)S.test=nouEstat().test;}catch(e){}
function save(){try{sessionStorage.setItem(STORE,JSON.stringify(S));}catch(e){}}

/* Ordre fix: primer la situació actual (sense Acord) i després el canvi (amb Acord). No es canvia mai,
   perquè l'ordre és part de la lectura (disseny_v4.md §5). */
const SIDES = ["sense","amb"];
const SC = {sense:"Sense Acord", amb:"Amb Acord"};
const SUB = {sense:"Situació actual", amb:"Si l'Acord entra en vigor"};
const SERIE = 5;
// Les preguntes amb el mateix efecte en tots dos escenaris no es poden triar: queden als temes.
const ELEG = D.preguntes.filter(q=>!q.igual);
const SENS = new Set(D.temes.filter(t=>t.sensible).map(t=>t.id));

/* Motiu: dues peces equivalents unides per una pregunta (estil.md D07) */
const mark = (cls="mark")=>`<svg class="${cls}" viewBox="0 0 30 22" aria-hidden="true"><path d="M6.5 6V1.5h17V6" fill="none" stroke="currentColor" stroke-width="2"/><rect x="1" y="7" width="11" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><rect x="18" y="7" width="11" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;
const glyph = side=>`<svg class="glyph" viewBox="0 0 30 22" aria-hidden="true"><rect x="1" y="4" width="11" height="16" rx="2" fill="${side==="sense"?"currentColor":"none"}" stroke="currentColor" stroke-width="2"/><rect x="18" y="4" width="11" height="16" rx="2" fill="${side==="amb"?"currentColor":"none"}" stroke="currentColor" stroke-width="2"/></svg>`;
const ico = {
  ok:`<svg class="ico" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="10" fill="currentColor"/><path d="M5.5 10.5l3 3 6-6.5" fill="none" stroke="#fff" stroke-width="2.2"/></svg>`,
  ko:`<svg class="ico" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="10" fill="currentColor"/><path d="M6.5 6.5l7 7M13.5 6.5l-7 7" fill="none" stroke="#fff" stroke-width="2.2"/></svg>`,
  ns:`<svg class="ico" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M6 10h8" stroke="currentColor" stroke-width="2.2"/></svg>`
};
const note = (d,txt)=>`<aside class="dnote" aria-label="Nota de disseny"><b>${esc(d)}</b> · ${txt}</aside>`;
const arrow = '<span aria-hidden="true">→</span>';
const topicIcons = {
  habitatge:'<path d="m3 11 9-8 9 8M5 10v11h5v-7h4v7h5V10"/>',
  salut:'<path d="M12 20s-7-4.4-8.6-9.2C2.3 7.3 4.6 4 8 4c1.8 0 3 .9 4 2.2C13 4.9 14.2 4 16 4c3.4 0 5.7 3.3 4.6 6.8C19 15.6 12 20 12 20Z"/><path d="M12 9v6M9 12h6"/>',
  social:'<circle cx="8" cy="8" r="3"/><circle cx="16.5" cy="8.5" r="2.5"/><path d="M2.5 20c0-3.3 2.5-6 5.5-6s5.5 2.7 5.5 6M14.5 14.4c.6-.3 1.3-.4 2-.4 2.8 0 5 2.4 5 5.5"/>',
  cultura:'<path d="M4 4h7v9.5a3.5 3.5 0 0 1-7 0V4Z"/><path d="M13 8h7v8.5a3.5 3.5 0 0 1-7 0M6 9h.01M9 9h.01M15 12h.01M18 12h.01"/>',
  treball:'<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V3h8v4M3 12c5 4 13 4 18 0M10 14h4"/>',
  educacio:'<path d="m2 9 10-5 10 5-10 5L2 9Z"/><path d="M6 11v5c3 2.2 9 2.2 12 0v-5M22 9v6"/>',
  professions:'<circle cx="12" cy="7" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8M12 13v4"/>',
  economia:'<path d="M3 20h18M5 16l4.5-5 3.5 3.5L19 7"/><path d="M15 7h4v4"/>',
  fiscalitat:'<path d="M19 5 5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>',
  financer:'<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
  agricultura:'<path d="M12 21V10M12 15c-4 0-7-3-7-7 4 0 7 3 7 7ZM12 11c0-4 3-7 7-7 0 4-3 7-7 7Z"/>',
  sobirania:'<path d="m3 8 9-5 9 5H3ZM5 11v7m7-7v7m7-7v7M3 21h18"/>',
  immigracio:'<rect x="4" y="3" width="16" height="18" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M8 17h8"/>',
  internacional:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 3.8 5.5 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.5-3.8-9S9.5 5.5 12 3Z"/>',
  administracio:'<path d="M4 21V8l8-5 8 5v13"/><path d="M9 21v-6h6v6M9 10h.01M15 10h.01"/>'
};
const topicIcon = id=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${topicIcons[id]||topicIcons.sobirania}</svg>`;

/* ---------- Components de lectura ---------- */
const tab = s=>s.taula?`<table class="minitab"><caption>${esc(s.taula.titol)}</caption><tbody>${s.taula.files.map(f=>`<tr><td>${esc(f[0])}</td><td>${esc(f[1])}</td></tr>`).join("")}</tbody></table><p class="note-src">${esc(s.taula.nota)}</p>`:"";
function responseBody(s){
  const quals = s.qual.map(x=>`<div class="qual"><b>${esc(x.tipus)}</b>${esc(x.text)}</div>`).join("");
  return `<p class="resp">${esc(s.text)}</p>${tab(s)}${quals}<div class="tags" aria-label="Naturalesa de la informació">${s.naturalesa.map(n=>`<span class="tag nat">${esc(n)}</span>`).join("")}</div>`;
}
/* Primer nivell: resposta breu i condicions decisives. Les condicions no s'amaguen mai al detall. */
function essential(s){
  return `<p class="resp">${esc(s.breu||s.text)}</p>${s.qual.map(x=>`<p class="qual"><b>${esc(x.tipus)}</b>${esc(x.text)}</p>`).join("")}`;
}
/* Capçalera d'escenari: nom i subtítol, el mateix tractament als dos costats. */
const scenHead = (side,tag="h3",cls="scen-h")=>`<${tag} class="${cls}">${glyph(side)}<span>${SC[side]}<small class="scen-sub">${SUB[side]}</small></span></${tag}>`;
/* Un sol botó de font per pregunta: el panell mostra els fragments dels dos escenaris. */
const srcBtn = (q,{label="Mira la font",cls="btn sec srcbtn"}={})=>`<button class="${cls}" data-src="${q.id}">${label}<span class="sr">: ${esc(q.pregunta)}</span></button>`;
/* Més detall: el text complet (si és diferent de la frase resum), les taules, la naturalesa
   de la informació i els avisos de referència pendent. Si no hi ha res més, no es mostra. */
function mesDetall(q){
  const sides=SIDES.filter(s=>q[s].breu||q[s].taula);
  if(!sides.length&&!q.pendent) return "";
  return `<details class="more"><summary>Més detall</summary><div class="more-body">${SIDES.map(s=>`<section class="more-scen">${scenHead(s)}${q[s].breu?`<p>${esc(q[s].text)}</p>`:""}${tab(q[s])}<div class="tags" aria-label="Naturalesa de la informació">${q[s].naturalesa.map(n=>`<span class="tag nat">${esc(n)}</span>`).join("")}</div>${s==="amb"&&q.pendent?`<p class="pendent-src">${esc(q.pendent)}</p>`:""}</section>`).join("")}</div></details>`;
}

/* Tria: dos botons iguals. Mai preseleccionats; la tria es pot canviar o treure. */
function choiceRow(q,{flow=false}={}){
  const cur=S.tria[q.id];
  const b=side=>`<button class="tria-btn" data-act="tria" data-q="${q.id}" data-side="${side}" aria-pressed="${cur===side}"><span class="tria-pre">M'afavoreix més</span><span class="tria-sc">${glyph(side)}${SC[side]}</span></button>`;
  return `<div class="tria" role="group" aria-label="Què t'afavoreix més: ${esc(q.pregunta)}">
    <p class="tria-q">Què t'afavoreix més?</p>${SIDES.map(b).join("")}
    <div class="tria-alt">${flow?`<button class="btn link" data-act="salta" data-q="${q.id}">Salta aquesta pregunta</button>`:""}${!flow&&cur?`<button class="btn link" data-act="treu" data-q="${q.id}">Treu la tria</button>`:""}</div>
  </div>`;
}
function explica(q){
  const side=s=>`<section class="exp-scen">${scenHead(s)}${responseBody(q[s])}${s==="amb"&&q.pendent?`<p class="pendent-src">${esc(q.pendent)}</p>`:""}</section>`;
  return `<details class="explica" data-q="${q.id}"><summary>Explica-m'ho <span class="small">· text complet i font</span></summary><div class="exp-body">
    <div class="exp-pair">${SIDES.map(side).join("")}</div>
    ${q.mante?`<p class="mante"><b>Què es mantindria</b>${esc(q.mante)}</p>`:""}
    <p class="exp-src">${srcBtn(q)}</p></div></details>`;
}
/* Fitxa de lectura dels temes: frase resum dels dos escenaris, «Més detall» i la font. Sense tria:
   la valoració només es fa al recorregut «Amb o sense», amb preguntes a l'atzar. */
function qcard(q,{standalone=false}={}){
  const H = standalone?"h1":"h2";
  const scen = side=>`<section class="scen" aria-label="${SC[side]}">${scenHead(side)}${essential(q[side])}</section>`;
  return `<article class="qcard" id="q-${q.id}" aria-labelledby="h-${q.id}">
    <${H} class="q" id="h-${q.id}" tabindex="-1">${esc(q.pregunta)}</${H}>
    ${q.context?`<p class="qctx">${esc(q.context)}</p>`:""}
    ${q.igual?`<p class="igual">${mark("glyph")} Igual en tots dos escenaris</p>`:""}
    <div class="pair">${SIDES.map(scen).join("")}</div>
    ${q.mante?`<p class="mante"><b>Què es mantindria</b>${esc(q.mante)}</p>`:""}
    ${mesDetall(q)}
    <div class="qfoot">${srcBtn(q)}<button class="btn link" data-act="share" data-q="${q.id}">Comparteix aquesta pregunta</button></div>
  </article>`;
}

/* ---------- Recompte i posició ----------
   Només un recompte de tries: cap pes, cap puntuació, cap veredicte. */
function recompte(ids){
  let a=0,s=0;ids.forEach(id=>{if(S.tria[id]==="amb")a++;else if(S.tria[id]==="sense")s++;});return {a,s,n:a+s};
}
function inclinacio({a,s,n}){
  if(!n) return "Encara no has triat cap resposta.";
  if(a===s) return "Les teves respostes estan equilibrades entre els dos escenaris.";
  const cap=a>s?"amb Acord":"sense Acord", r=Math.abs(a-s)/n;
  return `Les teves respostes s'inclinen ${r<0.34?"lleugerament ":""}cap a l'escenari ${cap}.`;
}
/* Línia: «Sense Acord» a l'esquerra, «Amb Acord» a la dreta (el mateix ordre que les columnes),
   l'equilibri al mig. El punt es mou segons la diferència entre tries. Mateix color als dos costats. */
function linia(c,{titol="",petita=false}={}){
  const r=c.n?(c.a-c.s)/c.n:0, pct=50+r*50;
  const from=Math.min(50,pct), w=Math.abs(pct-50);
  const txt=`${titol?titol+": ":""}${c.s} sense Acord, ${c.a} amb Acord. ${inclinacio(c)}`;
  return `<figure class="linia${petita?" petita":""}">
    <div class="linia-counts" aria-hidden="true"><span><b>${c.s}</b> ${glyph("sense")} Sense Acord</span><span>Amb Acord ${glyph("amb")} <b>${c.a}</b></span></div>
    <div class="linia-eix" role="img" aria-label="${esc(txt)}"><span class="linia-mig"></span><span class="linia-tram" style="left:${from}%;width:${w}%"></span><span class="linia-punt${c.n?"":" buit"}" style="left:${pct}%"></span></div>
    <div class="linia-ext" aria-hidden="true"><span>Sense Acord</span><span>Equilibri</span><span>Amb Acord</span></div>
    ${petita?"":`<figcaption>${esc(inclinacio(c))}</figcaption>`}
  </figure>`;
}
const totesTries = ()=>Object.keys(S.tria).filter(id=>preg(id));
// Saltada: s'hi ha passat amb «Salta» i no s'ha triat després (ni al recorregut ni als temes).
const saltades = ids=>ids.filter(id=>S.flux.saltades[id]&&!S.tria[id]).length;

/* ---------- Recorregut: sèries de 5 ----------
   A les dues primeres sèries, com a mínim 2 de cada 5 preguntes són de temes sensibles.
   Dins de la sèrie, temes diferents sempre que es pugui. Primer les preguntes no vistes;
   després, les saltades. Una pregunta triada no torna a sortir. */
function shuffle(a,rnd=Math.random){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function triaSerie(st,rnd=Math.random){
  const asked=new Set(st.flux.fetes.flatMap(s=>s.ids));
  let unseen=ELEG.filter(q=>!asked.has(q.id)&&!st.tria[q.id]);
  let skipped=ELEG.filter(q=>asked.has(q.id)&&!st.tria[q.id]);
  const out=[], used=new Set();
  const pick=f=>{
    let c=unseen.filter(f);if(!c.length)c=skipped.filter(f);if(!c.length)return false;
    const pref=c.filter(q=>!used.has(q.tema)), from=pref.length?pref:c;
    const q=from[Math.floor(rnd()*from.length)];
    out.push(q);used.add(q.tema);unseen=unseen.filter(x=>x!==q);skipped=skipped.filter(x=>x!==q);return true;
  };
  if(st.flux.fetes.length<2) for(let i=0;i<2;i++) pick(q=>SENS.has(q.tema));
  while(out.length<SERIE&&pick(()=>true));
  return shuffle(out,rnd).map(q=>q.id);
}
function serieActual(){
  if(!S.flux.actual){
    const ids=triaSerie(S);
    if(!ids.length) return null;
    S.flux.actual={n:S.flux.fetes.length+1,ids,pos:0};
    S.flux.fetes.push({ids});
    save();
  }
  return S.flux.actual;
}

/* ---------- Pàgines ---------- */
const P = {};
let searchTerm = "";
const normalize = s=>s.normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase();
function searchForm(value=""){
  return `<form class="search-form" role="search"><label class="sr" for="question-search">Cerca entre les preguntes</label><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg><input id="question-search" name="question" type="search" maxlength="120" placeholder="Què vols saber? P. ex. feina, residents, impostos…" value="${esc(value)}"><button class="btn" type="submit">Cerca</button></form>`;
}
function topicList(){
  return `<ul class="topics">${actius().map(t=>{const qs=pregsDe(t.id);
    return `<li><a class="topic" href="#/tema/${t.id}"><span class="topic-icon">${topicIcon(t.id)}</span><span class="topic-text"><b>${esc(t.nom)}</b><span>${esc(t.frase)}</span><small>${qs.length} preguntes</small></span><span class="topic-n" aria-hidden="true">→</span></a></li>`;}).join("")}</ul>`;
}

/* Capçalera blava de les tres seccions. A la portada porta la marca gran; a «Temes» i
   «Quant en saps?», el nom de la secció. Sempre centrada. */
function hero({overline,titol,frase,portada=false}){
  return `<div class="v4-hero${portada?" portada":""}"><div class="wrap wide">
    <p class="overline">${overline}</p>${titol}${frase?`<p class="v4-lead">${frase}</p>`:""}
  </div></div>`;
}
const seccioHero = (titol,frase)=>hero({overline:"Amb o sense · l'Acord d'associació Andorra–UE",titol:`<h1 class="v4-h1" tabindex="-1">${titol}</h1>`,frase});

/* Portada = primera pregunta. */
function progressDots(a){
  return `<ol class="dots" aria-label="Pregunta ${Math.min(a.pos+1,SERIE)} de ${a.ids.length}">${a.ids.map((id,i)=>`<li class="${i<a.pos?(S.tria[id]?"fet":"saltat"):i===a.pos?"ara":""}"><span class="sr">${i<a.pos?(S.tria[id]?"Triada":"Saltada"):i===a.pos?"Actual":"Pendent"}</span></li>`).join("")}</ol>`;
}
function flowCard(q,a){
  const t=tema(q.tema);
  return `<article class="flow-card" id="q-${q.id}" aria-labelledby="h-${q.id}">
    <header class="flow-head">
      <a class="flow-tema" href="#/tema/${t.id}"><span class="mini-icon">${topicIcon(t.id)}</span>${esc(t.nom)}</a>
      <div class="flow-prog"><span>Sèrie ${a.n} · ${a.pos+1} de ${a.ids.length}</span>${progressDots(a)}</div>
    </header>
    <h2 class="flow-q" id="h-${q.id}" tabindex="-1">${esc(q.pregunta)}</h2>
    ${q.context?`<p class="qctx">${esc(q.context)}</p>`:""}
    <div class="pair flow-pair">${SIDES.map(s=>`<section class="scen" aria-label="${SC[s]}">${scenHead(s)}${essential(q[s])}</section>`).join("")}</div>
    ${choiceRow(q,{flow:true})}
    ${explica(q)}
    ${a.pos>0?`<div class="flow-back"><button class="btn link" data-act="enrere">← Torna a la pregunta anterior</button></div>`:""}
  </article>`;
}
function serieBalanc(a){
  const c=recompte(a.ids), salt=saltades(a.ids);
  const g=recompte(totesTries()), mes=a.n>1||g.n>c.n;
  return `<section class="flow-card balanc-prov" aria-labelledby="bp-h">
    <p class="overline">Sèrie ${a.n} completada</p>
    <h2 id="bp-h" tabindex="-1">El teu balanç provisional</h2>
    ${linia(c,{titol:`Sèrie ${a.n}`})}
    ${salt?`<p class="small muted">${salt===1?"Has saltat 1 pregunta, que no compta.":`Has saltat ${salt} preguntes, que no compten.`}</p>`:""}
    ${mes?`<div class="global-mini"><h3>Fins ara, totes les sèries</h3>${linia(g,{titol:"Total",petita:true})}<p class="small">${esc(inclinacio(g))}</p></div>`:""}
    <ul class="serie-list">${a.ids.map(id=>{const q=preg(id),t=S.tria[id];return `<li><span class="overline">${esc(tema(q.tema).nom)}</span><a href="#/q/${q.id}">${esc(q.pregunta)}</a><b class="tria-tag ${t||"cap"}">${t?SC[t]:"Saltada"}</b><span class="serie-fl" aria-hidden="true">›</span></li>`;}).join("")}</ul>
    <p class="personal-note">És el recompte de les teves tries. No és una puntuació de l'Acord, ni una previsió, ni una recomanació.</p>
    <div class="actions"><button class="btn" data-act="serie-nova">5 preguntes més ${arrow}</button><a class="btn sec" href="#/balanc">Revisa les teves respostes</a></div>
  </section>`;
}
function flowAside(){
  const g=recompte(totesTries());
  return `<aside class="flow-aside" aria-label="El teu recorregut">
    <section class="aside-card"><h2>Les teves tries</h2>${linia(g,{petita:true,titol:"Total"})}<p class="small">${g.n?`${g.n} ${g.n===1?"pregunta triada":"preguntes triades"} de ${ELEG.length}.`:"Tria a cada pregunta l'escenari que t'afavoreix més. Si no ho saps, salta-la."}</p>${g.n?`<a class="small" href="#/balanc">Revisa les teves respostes ${arrow}</a>`:""}</section>
    <p class="aside-priv">${mark("glyph")} Les teves tries no surten d'aquest navegador.</p>
  </aside>`;
}
P.inici = ()=>{
  const a=serieActual();
  let main;
  if(!a) main=`<section class="flow-card"><h2 tabindex="-1">Has passat per totes les preguntes</h2><p>Les pots revisar o canviar quan vulguis.</p><div class="actions"><a class="btn" href="#/balanc">Mira el teu balanç</a><a class="btn sec" href="#/temes">Explora per temes</a></div></section>`;
  else if(a.pos>=a.ids.length) main=serieBalanc(a);
  else main=flowCard(preg(a.ids[a.pos]),a);
  return `${hero({portada:true,overline:"L'Acord d'associació Andorra–UE",
      titol:`<h1 id="home-title" tabindex="-1"><span class="aos">Amb <em>o</em> sense</span><span class="claim">Què canvia?</span></h1>`,
      frase:"Una pregunta cada vegada. Llegeix què passa avui, sense Acord, i què passaria amb Acord, i tria què t'afavoreix més. Cada 5 preguntes, el teu balanç."})}
  <div class="wrap wide v4-grid"><div class="v3-main">${main}</div>${flowAside()}</div>
  <div class="wrap wide v4-peu">
    <p class="v4-enllac">Sobre l'Acord i on som del procés: <a href="https://www.andorraue.ad/ca/" rel="noopener">andorraue.ad</a></p>
    
  </div>`;
};

P.cerca = ()=>{
  const terms=normalize(searchTerm).trim().split(/\s+/).filter(Boolean);
  const matches=terms.length?D.preguntes.filter(q=>{
    const h=normalize([tema(q.tema).nom,q.pregunta,q.context,q.amb.text,q.sense.text,q.amb.breu,q.sense.breu,...q.amb.qual.map(x=>x.text),...q.sense.qual.map(x=>x.text)].join(" "));
    return terms.every(t=>h.includes(t));
  }):D.preguntes;
  return `<div class="wrap narrow"><div class="pagehead"><div class="crumbs"><a href="#/">Inici</a> / Cerca</div><h1 tabindex="-1">Què vols saber?</h1><p>Cerca entre les ${D.preguntes.length} preguntes dels ${D.temes.length} temes.</p></div>${searchForm(searchTerm)}<p class="search-count" role="status">${matches.length} ${matches.length===1?"pregunta trobada":"preguntes trobades"}</p><div class="search-results">${matches.map(q=>`<a href="#/q/${q.id}"><span class="overline">${esc(tema(q.tema).nom)}</span><h2>${esc(q.pregunta)}</h2><span class="step-link">Compara els escenaris ${arrow}</span></a>`).join("")||`<div class="card"><h2>No hem trobat cap pregunta.</h2><p>Prova una paraula més general, com «feina», «residents» o «lleis».</p><a href="#/temes">Mira els temes →</a></div>`}</div></div>`;
};

P.temes = ()=>`${seccioHero("Temes",`Els ${D.temes.length} temes del quadre comparatiu. Dins de cada tema, totes les preguntes amb les dues respostes i la font.`)}
<div class="wrap wide v4-sobre">
  ${topicList()}
  <p class="search-hint">O bé <a href="#/cerca">cerca una pregunta</a>.</p>
</div>`;

/* Tema: capçalera blava com les seccions i, a pantalla gran, la llista dels temes a l'esquerra
   perquè el text tingui amplada i es pugui saltar d'un tema a l'altre. Al mòbil, la llista no hi és. */
P.tema = (id)=>{
  const t=tema(id); if(!t) return P.nf();
  const qs=pregsDe(id), altres=actius().filter(x=>x.id!==id);
  return `${hero({overline:`<a href="#/temes">Temes</a>`,titol:`<h1 class="v4-h1 tema-h1" tabindex="-1"><span class="tema-ico">${topicIcon(t.id)}</span>${esc(t.nom)}</h1>`,frase:esc(t.intro)})}
<div class="wrap wide tema-v4 v4-sobre">
  <nav class="tema-nav" aria-label="Temes"><p class="tema-nav-h">Temes</p><ul>${actius().map(x=>`<li><a href="#/tema/${x.id}"${x.id===id?' aria-current="page"':""}><span class="mini-icon">${topicIcon(x.id)}</span><span>${esc(x.nom)}</span></a></li>`).join("")}</ul></nav>
  <div class="tema-cos">
  ${qs.map(q=>qcard(q)).join("")}
  <section class="after" aria-label="Quant en saps de ${esc(t.nom)}?">
    <div class="after-card main"><h2>Quant en saps de ${esc(t.nom)}?</h2><p>Tres preguntes sobre ${esc(t.nom)}, amb l'explicació i la font de cada resposta.</p>
      <button class="btn" data-act="test-start" data-mode="${id}">Respon tres preguntes</button></div>
    <p class="other-topics">Altres temes: ${altres.map(x=>`<a href="#/tema/${x.id}">${esc(x.nom)}</a>`).join(" · ")}</p>
  </section>
  </div>
</div>`;
};

P.pregunta = (id)=>{
  const q=preg(id); if(!q) return P.nf();
  return `<div class="wrap narrow">
  <div class="crumbs"><a href="#/">Inici</a> / <a href="#/tema/${q.tema}">${esc(tema(q.tema).nom)}</a></div>
  <p class="small muted">Comparativa dels escenaris amb i sense Acord d'associació Andorra–UE. Revisat el ${esc(D.revisio)}.</p>
  ${qcard(q,{standalone:true})}
  <div class="actions"><a class="btn" href="#/tema/${q.tema}">Totes les preguntes de ${esc(tema(q.tema).nom)}</a><a class="btn sec" href="#/">Preguntes a l'atzar</a></div>
</div>`;
};

/* El teu balanç: recompte global, sèries i revisió pregunta per pregunta. */
P.balanc = ()=>{
  const ids=totesTries(), g=recompte(ids);
  const ordre=[...ids].sort((x,y)=>D.preguntes.findIndex(q=>q.id===x)-D.preguntes.findIndex(q=>q.id===y));
  return `<div class="wrap narrow balance-page"><div class="pagehead"><div class="crumbs"><a href="#/">Inici</a></div><h1 tabindex="-1">El teu balanç</h1>
    <p>El recompte de les preguntes on has triat què t'afavoreix més. Totes compten igual.</p></div>
    ${g.n?`<section class="card big-linia">${linia(g,{titol:"Total"})}<p class="small muted" style="margin:0">${g.n} de ${ELEG.length} preguntes triades. És el recompte de les teves tries: no és una puntuació de l'Acord, ni una previsió, ni una recomanació.</p></section>`
      :`<section class="card"><h2>Encara no has triat cap pregunta</h2><p>Comença amb una pregunta a l'atzar o obre un tema.</p><div class="actions"><a class="btn" href="#/">Comença</a><a class="btn sec" href="#/temes">Tria un tema</a></div></section>`}
    ${ordre.length?`<section class="respostes" aria-labelledby="resp-h"><h2 id="resp-h">Les teves respostes</h2><p class="small muted">Obre una pregunta per veure'n el detall i la font, o per canviar la tria.</p>
      ${ordre.map(id=>{const q=preg(id),t=S.tria[id];return `<details class="resp-item"><summary><span class="overline">${esc(tema(q.tema).nom)}</span><span class="resp-q">${esc(q.pregunta)}</span><b class="tria-tag ${t}">${SC[t]}</b></summary><div class="resp-body">
        <div class="exp-pair">${SIDES.map(s=>`<section class="exp-scen">${scenHead(s)}${responseBody(q[s])}</section>`).join("")}</div>
        <p class="exp-src">${srcBtn(q)}</p>
        ${choiceRow(q)}</div></details>`;}).join("")}</section>`:""}
    <div class="actions no-print"><a class="btn" href="#/">${S.flux.actual&&S.flux.actual.pos<S.flux.actual.ids.length?"Continua la sèrie":"Més preguntes"}</a><button class="btn link" data-act="esborra">Esborra-ho tot</button></div>
  </div>`;
};

/* ---------- Test: tandes de 3 i partides ----------
   La partida suma totes les tandes («10 de 12») fins que es comença una partida nova.
   «No ho sé» compta com a pregunta jugada, però no és encert ni trenca la ratxa.
   La millor ratxa és el rècord de la sessió i es manté entre partides. Sense rànquings. */
const TANDA = 3;
const tkey = (t,i)=>t+":"+i;
function triaTanda(mode,rnd=Math.random){
  const all=mode==="tots"?actius().flatMap(t=>D.test[t.id].map((_,i)=>({tema:t.id,i}))):(D.test[mode]||[]).map((_,i)=>({tema:mode,i}));
  let pool=all.filter(x=>!S.test.vistes[tkey(x.tema,x.i)]);
  if(pool.length<TANDA){pool=pool.concat(shuffle(all.filter(x=>!pool.includes(x)),rnd));}
  const out=[],used=new Set();
  for(const x of shuffle(pool,rnd)){if(out.length===TANDA)break;if(mode==="tots"&&used.has(x.tema))continue;out.push(x);used.add(x.tema);}
  for(const x of pool){if(out.length===TANDA)break;if(!out.includes(x))out.push(x);}
  return out.map(x=>({...x,ans:null}));
}
function testStats({nomesRatxa=false}={}){
  const t=S.test,p=t.partida;
  const ratxa=`<div><dt>Ratxa</dt><dd>${p.ratxa}</dd></div><div><dt>Millor ratxa</dt><dd>${t.millor}</dd></div>`;
  if(nomesRatxa) return `<dl class="stats dues">${ratxa}</dl>`;
  return `<dl class="stats"><div class="stat-partida"><dt>Correctes</dt><dd>${p.encerts}<small> de ${p.preguntes}</small></dd></div><div><dt>Tandes</dt><dd>${p.hist.length}</dd></div>${ratxa}</dl>`;
}
const pct = (a,b)=>b?Math.round(a/b*100)+"%":"";
function anteriors(){
  const a=S.test.anteriors;
  return a.length?`<div class="partides-ant"><h3>Marcadors anteriors</h3><ul>${a.map(x=>`<li><b>${x.encerts} de ${x.preguntes}</b> <span>${pct(x.encerts,x.preguntes)} · ${x.tandes} ${x.tandes===1?"tanda":"tandes"}</span></li>`).join("")}</ul></div>`:"";
}
const novaPartidaBtn = ()=>S.test.partida.preguntes?`<button class="btn link" data-act="partida-nova">Comença un marcador nou</button>`:"";
function temaProgress(id){const p=S.test.perTema[id]||{ok:0,n:0};const tot=D.test[id].length;return {ok:p.ok,n:p.n,tot,pct:Math.round(Math.min(p.ok,tot)/tot*100)};}
P.test = (sub)=>{
  const T=S.test;
  if(sub==="joc"&&T.tanda) return P.tanda();
  return `${seccioHero("Quant en saps de l'Acord?","Tres preguntes cada vegada sobre què diu l'Acord. Cada resposta té l'explicació i l'enllaç a la font. Res no surt del teu navegador.")}
  <div class="wrap wide test-page v4-sobre">
    <div class="test-top">
      <section class="test-hero"><h2>Tots els temes</h2><p>Tres preguntes de temes diferents, a l'atzar. Les que ja has vist no es repeteixen fins que les hagis fet totes.</p><button class="btn gold" data-act="test-start" data-mode="tots">Respon tres preguntes ${arrow}</button></section>
      <section class="test-score" aria-label="La teva puntuació"><h2>El teu marcador</h2>${testStats()}${T.partida.hist.length?`<ol class="tanda-hist">${T.partida.hist.slice(-8).map((h,i)=>`<li title="${h.ok} de ${h.n}"><span class="sr">Tanda ${T.partida.hist.length-Math.min(8,T.partida.hist.length)+i+1}: ${h.ok} de ${h.n}</span>${"●".repeat(h.ok)}${"○".repeat(h.n-h.ok)}</li>`).join("")}</ol>`:'<p class="small muted">Encara no has respost cap pregunta.</p>'}${novaPartidaBtn()}${anteriors()}</section>
    </div>
    <h2 class="test-h2">O tria un tema</h2>
    <ul class="test-temes">${actius().map(t=>{const p=temaProgress(t.id);return `<li><button class="test-tema" data-act="test-start" data-mode="${t.id}"><span class="mini-icon">${topicIcon(t.id)}</span><span class="tt-text"><b>${esc(t.nom)}</b><span class="tt-bar" aria-hidden="true"><i style="width:${p.pct}%"></i></span><small>${p.n?`${p.ok} correctes de ${p.n}`:`${p.tot} preguntes`}</small></span></button></li>`;}).join("")}</ul>
    
  </div>`;
};
P.tanda = ()=>{
  const T=S.test, td=T.tanda, its=td.items;
  const modeNom=td.mode==="tots"?"Tots els temes":tema(td.mode).nom;
  const marca=x=>{const Q=D.test[x.tema][x.i];return x.ans===Q.c?'<span class="ok">'+ico.ok+'</span>':x.ans===-1?'<span class="ns">'+ico.ns+'</span>':'<span class="ko">'+ico.ko+'</span>';};
  if(td.pos>=its.length){
    const ok=its.filter(x=>x.ans===D.test[x.tema][x.i].c).length;
    return `<div class="wrap narrow test-page"><div class="crumbs"><a href="#/test">Quant en saps?</a> / ${esc(modeNom)}</div>
      <section class="card tanda-fi" aria-labelledby="tf-h"><p class="overline">Tanda ${T.partida.hist.length} · ${esc(modeNom)}</p><h1 id="tf-h" tabindex="-1">${ok} de ${its.length}</h1>
      <p class="tanda-marks" aria-hidden="true">${its.map(marca).join("")}</p>
      <p>${ok===its.length?"Totes correctes.":"Repassa les que has fallat: cada pregunta enllaça a la resposta completa."}</p>
      <p class="partida-total">Marcador: <b>${T.partida.encerts} de ${T.partida.preguntes}</b> en ${T.partida.hist.length} ${T.partida.hist.length===1?"tanda":"tandes"}</p>
      ${testStats({nomesRatxa:true})}
      <div class="actions"><button class="btn" data-act="test-start" data-mode="${td.mode}">Tres preguntes més ${arrow}</button><a class="btn sec" href="#/test">Canvia de tema</a></div>
      <div class="actions partida-nova">${novaPartidaBtn()}</div></section>
      <details class="card tanda-rev"><summary>Repassa les 3 preguntes</summary>${its.map(x=>{const Q=D.test[x.tema][x.i];return `<div class="rev-item">${marca(x)}<div><b>${esc(Q.q)}</b><p>${esc(Q.o[Q.c])}. ${esc(Q.e)} <a href="#/tema/${x.tema}/${Q.ref}">Mira la resposta</a></p></div></div>`;}).join("")}</details></div>`;
  }
  const x=its[td.pos], Q=D.test[x.tema][x.i], done=x.ans!==null;
  const opt=(o,j)=>{
    const val=j<Q.o.length?j:-1;let cls="",icon="",badge="";
    if(done){
      if(val===Q.c){cls=" ok";icon=ico.ok;badge=(x.ans===val?"La teva resposta · ":"")+"Correcta";}
      else if(val===x.ans&&val!==-1){cls=" ko";icon=ico.ko;badge="La teva resposta";}
      else cls=val===x.ans?" tria":" off";
    }
    return `<button class="opt-btn${val===-1?" ns":""}${cls}" ${done?"disabled":`data-act="test-resp" data-v="${val}"`}>${icon}<span class="opt-t">${esc(o)}</span>${badge?`<span class="badge">${badge}</span>`:""}</button>`;
  };
  return `<div class="wrap narrow test-page"><div class="crumbs"><a href="#/test">Quant en saps?</a> / ${esc(modeNom)}</div>
    <section class="tq card" aria-labelledby="tq-h"><div class="tq-head"><span class="eyebrow">${esc(tema(x.tema).nom)}</span><span class="tq-pos">Pregunta ${td.pos+1} de ${its.length}</span><ol class="dots" aria-hidden="true">${its.map((y,i)=>`<li class="${i<td.pos||(i===td.pos&&done)?(y.ans===D.test[y.tema][y.i].c?"fet":"saltat"):i===td.pos?"ara":""}"></li>`).join("")}</ol></div>
      <h1 id="tq-h" tabindex="-1">${esc(Q.q)}</h1>
      <div class="opts" role="group" aria-labelledby="tq-h">${[...Q.o,"No ho sé"].map(opt).join("")}</div>
      ${done?`<div class="feedback ${x.ans===Q.c?"ok":x.ans===-1?"":"ko"}" role="status"><p><b>${x.ans===Q.c?(T.partida.ratxa>1?`Correcte. Ratxa de ${T.partida.ratxa}.`:"Correcte."):x.ans===-1?"Aquesta és la resposta.":"No és aquesta."}</b> ${esc(Q.e)}</p><a href="#/tema/${x.tema}/${Q.ref}">Mira la resposta completa</a></div>
        <div class="actions"><button class="btn" data-act="test-next" id="test-next">${td.pos+1<its.length?"Següent pregunta":"Mira el resultat"} ${arrow}</button></div>`:""}
    </section></div>`;
};

/* Tornar al joc: si des del test s'obre una resposta, un botó fix permet tornar-hi
   a la mateixa pregunta (o al resultat de la tanda). Es pot tancar. */
function tornaTest(cur){
  $("#torna-test")?.remove();
  const td=S.test.tanda;
  if(!td||!S.test.tornar||cur==="test")return;
  const fi=td.pos>=td.items.length;
  const box=document.createElement("div");box.id="torna-test";box.className="torna-test";
  box.innerHTML=`<a class="torna-btn" href="#/test/joc"><span aria-hidden="true">←</span> ${fi?"Torna al resultat":`Torna a les preguntes · ${td.pos+1} de ${td.items.length}`}</a><button class="torna-x" data-act="torna-tanca" aria-label="Amaga el botó de tornar a les preguntes">×</button>`;
  document.body.appendChild(box);
}

/* ---------- Pàgines informatives ---------- */
P.nocanvia = ()=>`<div class="wrap narrow"><div class="pagehead"><div class="crumbs"><a href="#/">Inici</a></div><h1 tabindex="-1">Què no canvia, amb o sense Acord</h1><p>Elements que el quadre comparatiu descriu com a iguals en tots dos escenaris.</p></div>
  <div class="card"><ul class="list" style="margin:0">${D.nocanvia.items.map(i=>`<li>${esc(i)}</li>`).join("")}</ul><button class="btn sec" data-src="nocanvia">Consulta la font</button></div></div>`;
P.fonts = ()=>{
  const usats=new Set(D.preguntes.flatMap(q=>SIDES.flatMap(s=>q[s].fonts.map(f=>f.doc))));
  return `<div class="wrap narrow"><div class="pagehead"><div class="crumbs"><a href="#/">Inici</a></div><h1 tabindex="-1">Fonts i metodologia</h1><p>D'on surt cada frase, i com es llegeix.</p></div>
  <div class="card"><h2>Documents de referència</h2><ul class="list">${Object.entries(D.docs).filter(([k])=>usats.has(k)).map(([,d])=>`<li><b>${esc(d.nom)}.</b> ${esc(d.autor)}. ${esc(d.versio)}${d.fitxer?` <a href="${esc(d.fitxer)}" target="_blank" rel="noopener">Obre el PDF</a>`:""}</li>`).join("")}</ul></div>
  <div class="card"><h2>Què vol dir cada etiqueta</h2><dl class="gloss" style="margin:0"><dt>Previsió del text</dt><dd>El que diu l'articulat de l'Acord.</dd><dt>Explicació institucional</dt><dd>La lectura del Govern sobre què implica, segons el quadre comparatiu.</dd><dt>Condició · Termini · Excepció · Incertesa</dt><dd>Matisos que canvien com s'ha de llegir una resposta. Es mostren sempre al costat de la resposta.</dd></dl></div>
  <div class="card"><h2>Com es redacten els resums</h2><ul class="list" style="margin:0"><li>Cada resum correspon a un fragment identificat del quadre comparatiu.</li><li>Cada resposta té dues versions: una de breu, per a la primera lectura, i el text complet, a «Explica-m'ho».</li><li>La mateixa terminologia per als dos escenaris, i cap adjectiu valoratiu.</li><li>Els resums els proposa l'equip del projecte i els valida la Secretaria d'Estat per a les Relacions amb la UE.</li><li>Estat: <b>esborrany pendent de validació</b>. Última revisió: ${esc(D.revisio)}.</li></ul></div>
  <div class="card"><h2>Com es trien les preguntes</h2><ul class="list" style="margin:0"><li>Les preguntes surten a l'atzar, en sèries de 5, de temes diferents sempre que es pugui.</li><li>A les dues primeres sèries, com a mínim 2 de cada 5 són dels temes que més preocupen: habitatge, economia, fiscalitat, sobirania, i immigració i seguretat.</li><li>Les preguntes on els dos escenaris coincideixen no es demanen: les trobaràs als temes.</li><li>El balanç és un recompte: totes les tries compten igual.</li></ul></div></div>`;
};

/* ---------- Senyal anònim d'ús ----------
   Desactivat: ENDPOINT és null fins que la Secretaria i el delegat de protecció de dades ho aprovin
   i l'allotjament ho permeti. Mai no inclou les tries, el balanç ni quines preguntes s'han vist. */
const ENDPOINT = null;
const visita = (()=>{try{const b=new Uint8Array(8);crypto.getRandomValues(b);return [...b].map(x=>x.toString(16).padStart(2,"0")).join("");}catch(e){return "";}})();
const tram = (v,ls)=>{for(const [lim,et] of ls) if(v<lim) return et; return ls[ls.length-1][1];};
function senyal(){
  const answered=totesTries().length, asked=S.flux.fetes.flatMap(s=>s.ids);
  const min=(Date.now()-(S.us.inici||Date.now()))/60000;
  return {
    v:3, visita, dia:new Date().toISOString().slice(0,10),
    pantalla:innerWidth<700?"mobil":innerWidth<1100?"tauleta":"ordinador",
    llengua:"ca", durada:tram(min,[[1,"<1 min"],[5,"1-5 min"],[15,"5-15 min"],[Infinity,">15 min"]]),
    preguntes:{triades:answered, saltades:saltades(asked), series:S.flux.fetes.length-(S.flux.actual&&S.flux.actual.pos<S.flux.actual.ids.length?1:0)},
    explicacions:S.us.detall, fonts:S.us.fonts, balanc:S.us.balanc>0, temes:S.us.temes,
    test:(()=>{const t=S.test,ps=[...t.anteriors,{preguntes:t.partida.preguntes,tandes:t.partida.hist.length}].filter(x=>x.preguntes);
      return {partides:ps.length, tandes:ps.reduce((n,x)=>n+x.tandes,0), preguntes:tram(ps.reduce((n,x)=>n+x.preguntes,0),[[1,"0"],[4,"1-3"],[10,"4-9"],[25,"10-24"],[Infinity,"25+"]]), millorRatxa:tram(t.millor,[[1,"0"],[3,"1-2"],[6,"3-5"],[Infinity,"6+"]])};})()
  };
}
const gpc = ()=>navigator.globalPrivacyControl===true;
let enviat=false;
function envia(){
  if(!ENDPOINT||!S.senyal||gpc()||!navigator.sendBeacon) return;
  try{navigator.sendBeacon(ENDPOINT,new Blob([JSON.stringify(senyal())],{type:"application/json"}));enviat=true;}catch(e){}
}
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden")envia();});

P.privacitat = ()=>`<div class="wrap narrow">
  <div class="pagehead"><div class="crumbs"><a href="#/">Inici</a></div><h1 tabindex="-1">Com es tracta la teva informació</h1>
  <p>Les teves tries i les respostes del test no surten del teu navegador.</p></div>
  <div class="card"><h2>El que fa aquesta eina</h2><ul class="list" style="margin:0">
    <li>No et demana cap dada: ni nom, ni correu, ni edat, ni nacionalitat.</li>
    <li>Les tries, el balanç i el test es calculen al navegador. Es conserven en aquesta pestanya mentre la tens oberta, perquè no els perdis si recarregues la pàgina, i s'esborren quan la tanques.</li>
    <li>No fa servir galetes ni recursos de tercers.</li>
    <li>El servidor no sap quines preguntes consultes ni què tries: la part de l'adreça que ho indica, després del símbol «#», els navegadors no l'envien mai.</li></ul>
    <div class="actions" style="margin-top:16px"><button class="btn sec" data-act="esborra">Esborra ara les meves respostes</button></div></div>
  <div class="card senyal-card"><h2>Estadístiques anònimes d'ús <span class="tag">En preparació</span></h2>
    <p>Per saber si l'eina és útil, la versió definitiva podria enviar <b>un sol missatge anònim per visita</b>, en tancar la pàgina, al mateix servidor que l'allotja. Només conté comptadors: quantes preguntes has triat, si has obert explicacions o fonts, si has jugat al test. <b>Mai no conté què has triat</b>, ni el teu balanç, ni quines preguntes has vist, ni cap identificador que et reconegui en una altra visita.</p>
    <p><b>En aquesta demo no s'envia res</b>: encara no hi ha servidor per rebre'l. Aquest és el missatge que s'enviaria ara mateix:</p>
    <pre class="senyal-pre" aria-label="Missatge anònim que s'enviaria">${esc(JSON.stringify(senyal(),null,2))}</pre>
    <label class="export-check"><input type="checkbox" data-senyal ${S.senyal?"":"checked"}><span>No enviïs aquest missatge des d'aquest navegador.</span></label>
    ${gpc()?'<p class="small">El teu navegador té activat Global Privacy Control: no s\'enviaria igualment.</p>':""}
    <p class="small muted" style="margin:0">El número «visita» es genera a l'atzar en obrir la pàgina i no es desa enlloc: només serveix perquè el servidor no compti dues vegades la mateixa visita.</p></div>
  <div class="card"><h2>Com ho pots comprovar</h2><ol class="list" style="margin:0">
    <li><b>Mode avió.</b> Un cop carregada la pàgina, activa el mode avió i fes servir l'eina sencera. Funciona igual.</li>
    <li><b>Eines del navegador.</b> A la pestanya de xarxa no hi apareix cap petició quan tries o jugues al test.</li></ol></div>
  <div class="card"><h2>L'allotjament d'aquesta demo</h2><p>Quan visites la demo publicada a GitHub Pages, el servei rep la teva adreça IP i, segons la seva documentació, la registra per motius de seguretat. Això és independent del que fas dins de l'eina.</p><p style="margin:0">Més informació: <a href="https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages#data-collection" rel="noopener">recollida de dades a GitHub Pages</a>.</p></div>
  <div class="card"><h2>La privacitat de la versió definitiva</h2><p style="margin:0">El domini i l'allotjament definitius estan per confirmar. Abans de posar l'eina en servei, aquest apartat s'actualitzarà amb la política de privadesa aplicable: qui és el responsable del tractament, quines dades registra l'allotjament, durant quant de temps i com exercir els teus drets.</p></div>
</div>`;

P.glossari = ()=>`<div class="wrap narrow"><div class="pagehead"><div class="crumbs"><a href="#/">Inici</a></div><h1 tabindex="-1">Glossari</h1></div>
  <div class="card"><dl class="gloss" style="margin:0">${D.glossari.map(g=>`<dt>${esc(g.t)}</dt><dd>${esc(g.d)}</dd>`).join("")}</dl></div></div>`;
P.nf = ()=>`<div class="wrap narrow"><h1 tabindex="-1">Aquesta pàgina no existeix</h1><p><a href="#/">Torna a l'inici</a></p></div>`;

/* ---------- Panell de fonts ---------- */
let lastFocus=null;
/* Panell de la font: una pregunta, els fragments agrupats per escenari (sense Acord primer).
   L'autor i la versió de cada document surten una sola vegada, al final. */
function openSrc(key){
  let grups,title;
  if(key==="nocanvia"){grups=[{side:null,frags:D.nocanvia.fonts}];title="Què no canvia, amb o sense Acord";}
  else{const q=preg(key);if(!q)return;grups=SIDES.map(side=>({side,frags:q[side].fonts}));title=q.pregunta;}
  grups=grups.filter(g=>g.frags.length);
  S.us.fonts++;save();
  lastFocus=document.activeElement;
  const docs=[...new Set(grups.flatMap(g=>g.frags.map(f=>f.doc)))].map(k=>D.docs[k]);
  const frag=f=>{const d=D.docs[f.doc];return `<div class="frag">
      <p class="frag-doc"><b>${esc(d.nom)}</b> <span class="tag nat">${esc(d.naturalesa)}</span></p>
      <p class="frag-loc">${esc(f.loc)}</p>
      <blockquote><span class="sr">Fragment de la font: </span>${esc(f.text)}</blockquote>
      ${f.nota?`<p class="fnote">${esc(f.nota)}</p>`:""}
      <p class="flink">${d.fitxer?`<a href="${esc(d.fitxer)}${f.page?"#page="+f.page:""}" target="_blank" rel="noopener">Obre el document${f.page?" a la pàgina "+f.page:""} ${arrow}</a>`:"Document de treball de la Secretaria d'Estat. A la versió pública s'enllaçarà la versió publicada."}</p></div>`;};
  const html=`<div class="scrim" data-act="close-src"></div>
  <div class="panel" role="dialog" aria-modal="true" aria-labelledby="src-t">
    <header><h2 id="src-t">Font</h2><button class="btn sec" data-act="close-src">Torna a la pregunta</button></header>
    <div class="body"><p class="src-q">${esc(title)}</p>
    <div class="src-grups${grups.length>1?" dues":""}">${grups.map(g=>`<section class="src-grup">${g.side?scenHead(g.side,"h3","src-side"):""}${g.frags.map(frag).join("")}</section>`).join("")}</div>
    <section class="src-docs"><h3>Documents citats</h3><ul>${docs.map(d=>`<li><b>${esc(d.nom)}</b> · ${esc(d.autor)}. ${esc(d.versio)}</li>`).join("")}</ul></section>
    <p class="who">Fragment de la font: text original, sense modificar.<br>Resum redactat per l'equip del projecte · Validació de la Secretaria d'Estat: pendent · Revisat el ${esc(D.revisio)}. <a href="#/fonts">Fonts i metodologia</a></p>
    </div></div>`;
  const box=document.createElement("div");box.id="src";box.innerHTML=html;document.body.appendChild(box);
  document.body.style.overflow="hidden";
  $("#src .panel header .btn").focus();
}
function closeSrc(){const b=$("#src");if(!b)return;b.remove();document.body.style.overflow="";if(lastFocus&&document.contains(lastFocus))lastFocus.focus();}

/* ---------- Utilitats ---------- */
function toast(msg){let t=$(".toast");if(t)t.remove();t=document.createElement("div");t.className="toast";t.setAttribute("role","status");t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),3200);}
function anuncia(msg){const l=$("#viu");if(l){l.textContent="";setTimeout(()=>{l.textContent=msg;},30);}}
function copy(text){
  const done=()=>toast("Enllaç copiat. Obre la pregunta, sense les teves tries.");
  if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(text).then(done,()=>fallback());}else fallback();
  function fallback(){const i=document.createElement("textarea");i.value=text;i.style.position="fixed";i.style.opacity="0";document.body.appendChild(i);i.select();try{document.execCommand("copy");done();}catch(e){toast("Copia aquest enllaç: "+text);}i.remove();}
}
function reset(){const keep=S.senyal;S=nouEstat();S.senyal=keep;searchTerm="";save();toast("Fet. No queda res guardat.");}
/* ---------- Router ---------- */
let ultimaRuta=null;
function route(){
  const h=(location.hash||"#/").slice(2).split("/");
  // El balanç detallat ja no existeix: un sol balanç.
  if(["balanc-detallat","valora","exporta"].includes(h[0])){location.replace("#/balanc");return;}
  if(location.hash!==ultimaRuta){ultimaRuta=location.hash;if(h[0]==="tema")S.us.temes++;if(h[0]==="balanc")S.us.balanc++;}
  let html,cur;
  switch(h[0]){
    case "":cur="aos";html=P.inici();break;
    case "cerca":cur="temes";html=P.cerca();break;
    case "temes":case "situacio":cur="temes";html=P.temes();break;
    case "tema":cur="temes";html=P.tema(h[1]);break;
    case "q":cur="temes";html=P.pregunta(h[1]);break;
    case "balanc":case "resum":cur="aos";html=P.balanc();break;
    case "test":cur="test";html=P.test(h[1]);break;
    case "no-canvia":cur="";html=P.nocanvia();break;
    case "fonts":cur="";html=P.fonts();break;
    case "privacitat":cur="";html=P.privacitat();break;
    case "glossari":cur="";html=P.glossari();break;
    default:html=P.nf();
  }
  save();
  closeSrc();
  $("#app").classList.toggle("home-main",h[0]==="");
  $("#app").classList.toggle("hero-main",h[0]===""||h[0]==="temes"||h[0]==="tema"||h[0]==="situacio"||(h[0]==="test"&&!(h[1]==="joc"&&S.test.tanda)));
  document.body.classList.toggle("is-home",h[0]==="");
  $("#app").innerHTML=html;
  document.title=(h[0]===""?"Amb o sense · Què canvia?":($("#app h1")?.textContent||"Amb o sense")+" · Amb o sense");
  $$(".seccions a").forEach(a=>{if(a.dataset.sec===cur)a.setAttribute("aria-current","page");else a.removeAttribute("aria-current");});
  tornaTest(cur);
  if(h[0]==="tema"&&h[2]){const el=$("#q-"+h[2]);if(el){el.scrollIntoView();$("#h-"+h[2]).focus({preventScroll:true});return;}}
  window.scrollTo(0,0);
  const f=$("#app h1");if(f)f.focus({preventScroll:true});
}
function rerender(keepScroll=true){const y=window.scrollY;const focusId=document.activeElement?.id;route();if(keepScroll)window.scrollTo(0,y);if(focusId)document.getElementById(focusId)?.focus({preventScroll:true});}
/* Després de triar al recorregut: la pregunta següent agafa el focus, sense saltar la pàgina. */
function nextInFlow(msg){
  route();
  const card=$(".flow-card");
  if(card){const top=card.getBoundingClientRect().top+scrollY-16;if(scrollY>top||top-scrollY>innerHeight*0.5)window.scrollTo(0,Math.max(0,top));
    const h=$(".flow-card h2");if(h)h.focus({preventScroll:true});
    card.classList.add("entra");}
  anuncia(msg);
}
function avanca(){const a=S.flux.actual;if(!a)return;a.pos++;save();}

/* ---------- Esdeveniments ---------- */
document.addEventListener("submit",e=>{
  if(!e.target.matches(".search-form"))return;
  e.preventDefault();
  searchTerm=new FormData(e.target).get("question").trim().slice(0,120);
  if(location.hash==="#/cerca")route();else location.hash="#/cerca";
});
document.addEventListener("toggle",e=>{if(e.target.matches&&e.target.matches("details.explica,details.more")&&e.target.open){S.us.detall++;save();}},true);
document.addEventListener("click",e=>{
  const sortida=e.target.closest(".test-page a[href^='#/tema/'], .test-page a[href^='#/q/']");
  if(sortida&&S.test.tanda){S.test.tornar=true;save();}
  const src=e.target.closest("[data-src]");if(src){openSrc(src.dataset.src);return;}
  const a=e.target.closest("[data-act]");if(!a)return;
  const act=a.dataset.act, qid=a.dataset.q;
  if(act==="close-src")closeSrc();
  else if(act==="tria"){
    const side=a.dataset.side, f=S.flux.actual, inFlow=location.hash.replace(/^#\/?/,"")===""&&f&&f.ids[f.pos]===qid;
    S.tria[qid]=side;
    if(inFlow){avanca();const fet=f.pos>=f.ids.length;nextInFlow(fet?`Sèrie ${f.n} completada. Aquí tens el teu balanç provisional.`:`Desat: ${SC[side]}. Pregunta ${f.pos+1} de ${f.ids.length}.`);}
    else{save();rerender();const b=$(`[data-act="tria"][data-q="${qid}"][data-side="${side}"]`);if(b)b.focus({preventScroll:true});anuncia(`Desat: ${SC[side]}.`);}
  }
  else if(act==="salta"){const f=S.flux.actual;if(f&&f.ids[f.pos]===qid){S.flux.saltades[qid]=true;avanca();const fet=f.pos>=f.ids.length;nextInFlow(fet?`Sèrie ${f.n} completada.`:`Pregunta saltada. Pregunta ${f.pos+1} de ${f.ids.length}.`);}}
  else if(act==="enrere"){const f=S.flux.actual;if(f&&f.pos>0){f.pos--;save();nextInFlow(`Pregunta ${f.pos+1} de ${f.ids.length}.`);}}
  else if(act==="treu"){delete S.tria[qid];save();rerender();anuncia("Tria treta.");}
  else if(act==="serie-nova"){S.flux.actual=null;serieActual();nextInFlow("Sèrie nova. Pregunta 1 de 5.");}
  else if(act==="share"){const u=location.href.split("#")[0]+"#/q/"+qid;copy(u);}
  else if(act==="torna-tanca"){S.test.tornar=false;save();$("#torna-test")?.remove();}
  else if(act==="test-start"){const mode=a.dataset.mode;S.test.tornar=false;S.test.tanda={mode,items:triaTanda(mode),pos:0};save();if(location.hash==="#/test/joc")rerender(false);else location.hash="#/test/joc";}
  else if(act==="test-resp"){
    const T=S.test,td=T.tanda;if(!td)return;const x=td.items[td.pos];if(!x||x.ans!==null)return;
    const v=+a.dataset.v,Q=D.test[x.tema][x.i];x.ans=v;T.vistes[tkey(x.tema,x.i)]=true;
    const P_=T.partida;P_.preguntes++;
    if(v!==-1){const p=T.perTema[x.tema]||(T.perTema[x.tema]={ok:0,n:0});p.n++;
      if(v===Q.c){P_.encerts++;p.ok++;P_.ratxa++;T.millor=Math.max(T.millor,P_.ratxa);}else P_.ratxa=0;}
    if(td.items.every(it=>it.ans!==null)){P_.hist.push({mode:td.mode,ok:td.items.filter(it=>it.ans===D.test[it.tema][it.i].c).length,n:td.items.length});}
    save();rerender();$("#test-next")?.focus({preventScroll:true});
    anuncia(v===Q.c?"Correcte.":v===-1?"Aquesta és la resposta.":"No és aquesta.");
  }
  else if(act==="partida-nova"){
    const T=S.test,p=T.partida;
    if(p.preguntes){T.anteriors.unshift({encerts:p.encerts,preguntes:p.preguntes,tandes:p.hist.length});T.anteriors=T.anteriors.slice(0,5);}
    T.partida=novaPartida();T.vistes={};T.perTema={};T.tanda=null;T.tornar=false;save();
    if(location.hash==="#/test")rerender(false);else location.hash="#/test";
    anuncia("Marcador nou. Torna a zero.");
  }
  else if(act==="test-next"){const td=S.test.tanda;if(td){td.pos++;save();rerender(false);}}
  else if(act==="esborra"){reset();rerender(false);}
  else if(act==="notes"){const on=document.body.classList.toggle("notes");a.setAttribute("aria-pressed",on);a.textContent=on?"Amaga les notes de disseny":"Mostra les notes de disseny";}
});
document.addEventListener("change",e=>{
  const t=e.target;
  if(t.dataset.senyal!==undefined){S.senyal=!t.checked;save();rerender();}
});
document.addEventListener("keydown",e=>{
  if(e.key==="Escape"&&$("#src")){closeSrc();return;}
  if(e.key==="Tab"&&$("#src")){const f=$$("#src a, #src button");if(!f.length)return;const first=f[0],last=f[f.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
});
window.addEventListener("hashchange",route);
route();
})();
