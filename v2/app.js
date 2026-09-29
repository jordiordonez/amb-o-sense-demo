/* Amb o sense · demo. Tot l'estat viu en memòria: res no es desa ni s'envia. */
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

const S = {temes:new Set(), sit:new Set(), val:false, imp:{}, rat:{}, vistes:new Set(), revisar:new Set(), test:null, export:{detail:true,extras:false,personal:true}};
const IMP = ["Cap","Poca","Mitjana","Molta"];
const VAL = ["Molt desfavorable","Desfavorable","Ni favorable ni desfavorable","Favorable","Molt favorable"];
const VALN = [0,2.5,5,7.5,10];
const SC = {amb:"Amb Acord", sense:"Sense Acord"};

/* Motiu: dues peces equivalents unides per una pregunta (estil.md D07) */
const mark = (cls="mark")=>`<svg class="${cls}" viewBox="0 0 30 22" aria-hidden="true"><path d="M6.5 6V1.5h17V6" fill="none" stroke="currentColor" stroke-width="2"/><rect x="1" y="7" width="11" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><rect x="18" y="7" width="11" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;
const glyph = side=>`<svg class="glyph" viewBox="0 0 30 22" aria-hidden="true"><rect x="1" y="4" width="11" height="16" rx="2" fill="${side==="amb"?"currentColor":"none"}" stroke="currentColor" stroke-width="2"/><rect x="18" y="4" width="11" height="16" rx="2" fill="${side==="sense"?"currentColor":"none"}" stroke="currentColor" stroke-width="2"/></svg>`;
const check = `<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3 3 7-7" fill="none" stroke="#fff" stroke-width="2.4"/></svg>`;
const ico = {
  ok:`<svg class="ico" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="10" fill="currentColor"/><path d="M5.5 10.5l3 3 6-6.5" fill="none" stroke="#fff" stroke-width="2.2"/></svg>`,
  ko:`<svg class="ico" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="10" fill="currentColor"/><path d="M6.5 6.5l7 7M13.5 6.5l-7 7" fill="none" stroke="#fff" stroke-width="2.2"/></svg>`
};
// V2: sense notes de disseny a la pantalla. Les decisions es documenten a LLEGEIX.md.
const note = ()=>"";

/* ---------- Components ---------- */
function responseBody(s){
    const tab = s.taula?`<table class="minitab"><caption>${esc(s.taula.titol)}</caption><tbody>${s.taula.files.map(f=>`<tr><td>${esc(f[0])}</td><td>${esc(f[1])}</td></tr>`).join("")}</tbody></table><p class="note-src">${esc(s.taula.nota)}</p>`:"";
    const quals = s.qual.map(x=>`<div class="qual"><b>${esc(x.tipus)}</b>${esc(x.text)}</div>`).join("");
  return `<p class="resp">${esc(s.text)}</p>${tab}${quals}<div class="tags" aria-label="Naturalesa de la informació">${s.naturalesa.map(n=>`<span class="tag nat">${esc(n)}</span>`).join("")}</div>`;
}
/* V2 · Primer nivell: pregunta, resposta breu de cada escenari i condicions decisives.
   Les condicions, terminis i incerteses no s'amaguen mai en el detall. */
function essential(s){
  return `<p class="resp">${esc(s.breu||s.text)}</p>${s.qual.map(x=>`<p class="qual"><b>${esc(x.tipus)}</b>${esc(x.text)}</p>`).join("")}`;
}
function hasDetail(q){return !!(q.amb.taula||q.sense.taula||q.amb.breu||q.sense.breu);}
function qcard(q,{standalone=false}={}){
  const H = standalone?"h1":"h2";
  const scen = side=>{
    const s=q[side];
    return `<section class="scen" aria-label="${SC[side]}">
      <h3 class="scen-h">${glyph(side)}${SC[side]}</h3>
      ${essential(s)}
      ${side==="amb"&&q.pendent?`<p class="pendent-src">${esc(q.pendent)}</p>`:""}
      <p class="scen-src"><span class="nat">${s.naturalesa.map(esc).join(" · ")}</span><button class="btn link srcbtn" data-src="${q.id}:${side}">Mira la font<span class="sr"> de «${SC[side]}»: ${esc(q.pregunta)}</span></button></p>
    </section>`;
  };
  const tab = s=>s.taula?`<table class="minitab"><caption>${esc(s.taula.titol)}</caption><tbody>${s.taula.files.map(f=>`<tr><td>${esc(f[0])}</td><td>${esc(f[1])}</td></tr>`).join("")}</tbody></table><p class="note-src">${esc(s.taula.nota)}</p>`:"";
  const more = hasDetail(q)?`<details class="more"><summary>Més detall</summary><div>${["amb","sense"].filter(side=>q[side].breu||q[side].taula).map(side=>`<section><h3>${SC[side]}</h3>${q[side].breu?`<p>${esc(q[side].text)}</p>`:""}${tab(q[side])}</section>`).join("")}</div></details>`:"";
  return `<article class="qcard" id="q-${q.id}" aria-labelledby="h-${q.id}">
    <${H} class="q" id="h-${q.id}" tabindex="-1">${esc(q.pregunta)}</${H}>
    ${q.context?`<p class="qctx">${esc(q.context)}</p>`:""}
    ${q.igual?`<p class="igual">${mark("glyph")} Igual en tots dos escenaris</p>`:""}
    <div class="pair">${scen("amb")}${scen("sense")}</div>
    ${q.mante?`<p class="mante"><b>Què es mantindria</b>${esc(q.mante)}</p>`:""}
    ${more}
    <div class="qfoot"><button class="btn link" data-act="share" data-q="${q.id}">Comparteix aquesta pregunta</button></div>
  </article>`;
}

function impBlock(tid){
  const v=S.imp[tid];
  return `<fieldset class="choice"><legend>Quanta importància té ${esc(tema(tid).nom)} per a tu?</legend>
  <p class="hint">Serveix per decidir quant pesa aquest tema al teu balanç, si en valores més d'un. «Cap» el deixa fora del resultat general.</p>
  <div class="radios col">${IMP.map((x,i)=>`<label class="radio"><input type="radio" name="imp-${tid}" value="${i}" data-imp="${tid}" ${v===i?"checked":""}><span>${x}</span></label>`).join("")}</div></fieldset>`;
}
function rateBlock(q,side){
  const r=S.rat[q.id]||{};
  return `<fieldset class="choice"><legend>${glyph(side)} ${SC[side]}: com ho valores per a tu?</legend>
    <div class="radios col">${VAL.map((v,i)=>`<label class="radio"><input type="radio" name="r-${q.id}-${side}" value="${i}" data-rate="${q.id}:${side}" ${r[side]===i?"checked":""}><span>${v}</span></label>`).join("")}
    <label class="radio ns"><input type="radio" name="r-${q.id}-${side}" value="ns" data-rate="${q.id}:${side}" ${r[side]==="ns"?"checked":""}><span>Encara no ho sé</span></label></div></fieldset>`;
}

function bars(amb,sense){
  const row=(l,v)=>`<div class="brow"><span class="bl">${l}</span><div class="track" role="img" aria-label="${l}: ${fmt(v)} sobre 10"><div class="fill" style="width:${v*10}%"></div><div class="ticks"></div></div><span class="bv">${fmt(v)}</span></div>`;
  return `<div class="bars">${row(SC.amb,amb)}${row(SC.sense,sense)}<div class="scale"><i></i><span><span>0</span><span>5</span><span>10</span></span><i></i></div></div>`;
}
const fmt = v=>v.toFixed(1).replace(".",",");

/* ---------- Càlcul del balanç (estil.md D12) ---------- */
function calc(){
  const ids = new Set([...S.temes].filter(id=>tema(id).actiu));
  Object.keys(S.imp).forEach(id=>ids.add(id));
  Object.keys(S.rat).forEach(qid=>ids.add(preg(qid).tema));
  const temes=[...ids].map(id=>{
    const qs=pregsDe(id); let n=0,a=0,s=0,pend=0,ns=0;
    qs.forEach(q=>{const r=S.rat[q.id]||{};
      if(typeof r.amb==="number"&&typeof r.sense==="number"){n++;a+=VALN[r.amb];s+=VALN[r.sense];}
      else{ if(r.amb==="ns"||r.sense==="ns") ns++; else pend++; }});
    return {id,nom:tema(id).nom,total:qs.length,n,pend,ns,imp:S.imp[id],amb:n?a/n:null,sense:n?s/n:null};
  });
  const inGen=temes.filter(t=>t.n&&typeof t.imp==="number"&&t.imp>0);
  const W=inGen.reduce((x,t)=>x+t.imp,0);
  const gen=W?{amb:inGen.reduce((x,t)=>x+t.imp*t.amb,0)/W,sense:inGen.reduce((x,t)=>x+t.imp*t.sense,0)/W,n:inGen.length}:null;
  return {temes,gen,total:temes.reduce((x,t)=>x+t.total,0),complet:temes.reduce((x,t)=>x+t.n,0)};
}

/* ---------- Pàgines ---------- */
const P = {};

const arrow = '<span aria-hidden="true">↗</span>';
const topicIcons = {
  habitatge:'<path d="m3 11 9-8 9 8M5 10v11h5v-7h4v7h5V10"/>',
  treball:'<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V3h8v4M3 12c5 4 13 4 18 0M10 14h4"/>',
  sobirania:'<path d="m3 8 9-5 9 5H3ZM5 11v7m7-7v7m7-7v7M3 21h18"/>'
};
const topicIcon = id=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${topicIcons[id]||topicIcons.sobirania}</svg>`;
let searchTerm = "";
const normalize = s=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
function searchForm(value=""){
  return `<form class="search-form" role="search"><label class="sr" for="question-search">Cerca entre les preguntes de la demo</label><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg><input id="question-search" name="question" type="search" maxlength="120" placeholder="Què vols saber? P. ex. feina, residents, lleis…" value="${esc(value)}"><button class="btn" type="submit">Cerca ${arrow}</button></form>`;
}

/* V2 · Una llista clara de temes. Triar-ne un l'obre directament: sense passos previs. */
function topicList(){
  const off=D.temes.filter(t=>!t.actiu);
  return `<ul class="topics">${actius().map(t=>`<li><a class="topic" href="#/tema/${t.id}"><span class="topic-icon">${topicIcon(t.id)}</span><span class="topic-text"><b>${esc(t.nom)}</b><span>${esc(t.frase)}</span></span><span class="topic-n" aria-hidden="true">→</span></a></li>`).join("")}</ul>
  ${off.length?`<p class="soon-list"><b>En preparació:</b> ${off.map(t=>esc(t.nom)).join(" · ")}.</p>`:""}`;
}

P.inici = ()=>`<div class="wrap">
  <section class="intro-v2" aria-labelledby="home-title">
    <p class="overline">L'Acord d'associació Andorra–UE</p>
    <h1 id="home-title" tabindex="-1">Què canviaria amb l'Acord d'associació?</h1>
    <p class="lead">Tria un tema i compara què passaria amb Acord i sense. Cada resposta diu d'on surt.</p>
  </section>
  <section class="block" aria-labelledby="tria">
    <h2 id="tria">Tria un tema</h2>
    ${topicList()}
    ${note("V2 · Portada","Els temes apareixen a la primera pantalla, també al mòbil. Triar-ne un l'obre directament: no cal marcar-ne diversos ni confirmar. Sense famílies abstractes: una llista clara.")}
  </section>
  <section class="block how" aria-labelledby="com">
    <h2 id="com">Com funciona</h2>
    <ol class="steps">
      <li><b>Tria un tema.</b> Pots consultar-ne tants com vulguis.</li>
      <li><b>Llegeix què passaria amb Acord i sense.</b> Els dos escenaris, un al costat de l'altre, amb la font a un clic.</li>
      <li><b>Si vols, valora'ls i comprova què has entès.</b> És opcional. No et demanem cap dada i no es desa res.</li>
    </ol>
  </section>
  <section class="block keep" aria-labelledby="nc">
    <h2 id="nc">Amb Acord o sense, això no canvia</h2>
    <ul class="list">${D.nocanvia.items.map(i=>`<li>${esc(i)}</li>`).join("")}</ul>
    <button class="btn link srcbtn" data-src="nocanvia">Mira la font</button>
  </section>
  <section class="block proces" aria-labelledby="pr">
    <h2 id="pr">On som del procés</h2>
    <ol>${D.proces.map(p=>`<li class="${p[2]}"><time>${esc(p[0])}</time>${esc(p[1])}<div class="estat">${p[2]==="fet"?"Fet":"Previst"}</div></li>`).join("")}</ol>
    <p class="small muted">Revisat el ${esc(D.revisio)}. Font: <a href="https://www.andorraue.ad/ca/" rel="noopener">andorraue.ad</a></p>
    ${note("D05 · E08","Signatura, ratificació i entrada en vigor es distingeixen. Cap compte enrere.")}
  </section>
</div>`;

P.cerca = ()=>{
  const terms=normalize(searchTerm).trim().split(/\s+/).filter(Boolean);
  const matches=terms.length?D.preguntes.filter(q=>{
    const haystack=normalize([tema(q.tema).nom,q.pregunta,q.context,q.amb.text,q.sense.text,...q.amb.qual.map(x=>x.text),...q.sense.qual.map(x=>x.text)].join(" "));
    return terms.every(t=>haystack.includes(t));
  }):D.preguntes;
  return `<div class="wrap narrow"><div class="pagehead"><div class="crumbs"><a href="#/">Inici</a> / Cerca</div><h1 tabindex="-1">Què vols saber?</h1><p>Cerca entre les 11 preguntes disponibles en aquesta demo.</p></div>${searchForm(searchTerm)}<p class="search-count" role="status">${matches.length} ${matches.length===1?"pregunta trobada":"preguntes trobades"}</p><div class="search-results">${matches.map(q=>`<a href="#/q/${q.id}"><span class="overline">${esc(tema(q.tema).nom)}</span><h2>${esc(q.pregunta)}</h2><span class="step-link">Compara els escenaris ${arrow}</span></a>`).join("")||`<div class="card"><h2>No hem trobat cap pregunta.</h2><p>Prova una paraula més general, com «feina», «residents» o «lleis». La demo només inclou tres temes.</p><a href="#/temes">Mira els temes disponibles →</a></div>`}</div></div>`;
};

P.temes = ()=>`<div class="wrap">
  <div class="pagehead"><div class="crumbs"><a href="#/">Inici</a></div><h1 tabindex="-1">Tria un tema</h1>
  <p>Obre el que t'interessi. Pots tornar aquí i consultar-ne tants com vulguis.</p></div>
  ${topicList()}
</div>`;

P.tema = (id)=>{
  const t=tema(id); if(!t||!t.actiu) return P.nf();
  const qs=pregsDe(id), altres=actius().filter(x=>x.id!==id);
  const rated=qs.filter(q=>S.rat[q.id]).length;
  return `<div class="wrap narrow tema-v2">
  <div class="pagehead"><div class="crumbs"><a href="#/">Inici</a> / ${esc(t.nom)}</div>
    <h1 tabindex="-1">${esc(t.nom)}</h1><p class="intro">${esc(t.intro)}</p></div>
  <details class="toc"><summary>Les ${qs.length} preguntes del tema</summary><nav aria-label="Preguntes del tema"><ol>${qs.map(q=>`<li><a href="#/tema/${id}/${q.id}">${esc(q.pregunta)}</a></li>`).join("")}</ol></nav></details>
  ${note("V2 · Tema","L'essencial és visible sense obrir res: pregunta, resposta breu de cada escenari i condicions. Les condicions i incerteses que canvien el sentit de la resposta no es desen al detall. L’índex es pot obrir per saltar a una pregunta. «Més detall» amplia les respostes o mostra les xifres; els avisos de fonts pendents queden visibles.")}
  ${qs.map(q=>qcard(q)).join("")}
  <section class="after" aria-labelledby="after-h">
    <h2 id="after-h">I ara, què vols fer?</h2>
    <div class="after-grid">
      <div class="after-card main"><h3>Vols afegir la teva valoració?</h3><p>És opcional. Et mostrarem les preguntes d'una en una. Les valoracions es queden al teu navegador: no s'envien al Govern ni enlloc.</p>
        <a class="btn" href="#/valora/${id}">${rated?"Continua la valoració":"Valora aquest tema"}</a></div>
      <div class="after-card"><h3>Comprova què has entès</h3><p>${D.test[id].length} preguntes curtes sobre ${esc(t.nom)}, amb l'explicació de cada resposta.</p>
        <a class="btn sec" href="#/test/${id}">Fes la prova</a></div>
    </div>
    <p class="other-topics">Altres temes: ${altres.map(x=>`<a href="#/tema/${x.id}">${esc(x.nom)}</a>`).join(" · ")}</p>
    ${note("V2 · Valora després d'entendre","La valoració es proposa al final de la lectura, amb una invitació explícita. No hi ha interruptors ni controls repetits a cada pregunta.")}
  </section>
</div>`;
};

/* V2 · Valoració guiada: una pregunta cada vegada, amb els dos escenaris junts. */
P.valora = (id,step)=>{
  const t=tema(id); if(!t||!t.actiu) return P.nf();
  const qs=pregsDe(id), n=qs.length;
  let i=Number.parseInt(step,10); if(!(i>=1&&i<=n+1)) i=1;
  const head=`<div class="crumbs"><a href="#/">Inici</a> / <a href="#/tema/${id}">${esc(t.nom)}</a> / Valoració</div>
    <p class="progress"><span>${i<=n?`Pregunta ${i} de ${n}`:"Últim pas"}</span><span class="pbar" aria-hidden="true"><i style="width:${Math.round(Math.min(i,n+1)/(n+1)*100)}%"></i></span></p>`;
  if(i>n) return `<div class="wrap narrow valora">${head}
    <h1 tabindex="-1">Abans de veure el teu balanç</h1>
    ${impBlock(id)}
    <div class="actions"><a class="btn" href="#/balanc">Mira el teu balanç</a><a class="btn sec" href="#/valora/${id}/${n}">Torna enrere</a></div>
    <p class="small muted">El balanç resumeix les teves valoracions. No és una puntuació oficial de l'Acord.</p>
  </div>`;
  const q=qs[i-1];
  const side=s=>`<section class="rating-scenario"><div class="scen" aria-label="${SC[s]}"><h2 class="scen-h">${glyph(s)}${SC[s]}</h2>${essential(q[s])}${q[s].breu?`<details class="more"><summary>Més detall</summary><div><p>${esc(q[s].text)}</p></div></details>`:""}${s==="amb"&&q.pendent?`<p class="pendent-src">${esc(q.pendent)}</p>`:""}<button class="btn link srcbtn" data-src="${q.id}:${s}">Mira la font<span class="sr"> de ${SC[s]}</span></button></div>${rateBlock(q,s)}</section>`;
  return `<div class="wrap narrow valora">${head}
    <h1 tabindex="-1" id="h-${q.id}">${esc(q.pregunta)}</h1>
    ${q.context?`<p class="qctx">${esc(q.context)}</p>`:""}
    ${q.igual?`<p class="igual">${mark("glyph")} Igual en tots dos escenaris</p>`:""}
    <p class="hint">Valora cada escenari per separat. Pots triar «Encara no ho sé» o passar a la següent.</p>
    <div class="rate-grid">${side("amb")}${side("sense")}</div>
    <div class="actions steps-nav"><a class="btn" href="#/valora/${id}/${i+1}">${i<n?"Següent pregunta":"Continua"}</a>${i>1?`<a class="btn sec" href="#/valora/${id}/${i-1}">Anterior</a>`:""}<a class="btn link" href="#/tema/${id}">Deixa-ho aquí</a></div>
    ${note("V2 · Una pregunta cada vegada","Menys controls a la vista. Opcions escrites, «Encara no ho sé» sempre disponible i cap resposta preseleccionada. La importància es demana al final, quan té sentit per al balanç.")}
  </div>`;
};

P.pregunta = (id)=>{
  const q=preg(id); if(!q) return P.nf();
  return `<div class="wrap narrow">
  <div class="crumbs"><a href="#/">Inici</a> / <a href="#/tema/${q.tema}">${esc(tema(q.tema).nom)}</a></div>
  <p class="small muted">Comparativa dels escenaris amb i sense Acord d'associació Andorra–UE. Revisat el ${esc(D.revisio)}.</p>
  ${qcard(q,{standalone:true})}
  ${note("D17","Enllaç directe a una pregunta: mostra els dos escenaris i la data, sense passar per la portada. L'enllaç no porta valoracions.")}
  <div class="actions"><a class="btn" href="#/tema/${q.tema}">Totes les preguntes de ${esc(tema(q.tema).nom)}</a><a class="btn sec" href="#/temes">Altres temes</a></div>
</div>`;
};

const hasRating = q=>["amb","sense"].some(side=>S.rat[q.id]?.[side]!==undefined);
const completeRating = q=>["amb","sense"].every(side=>typeof S.rat[q.id]?.[side]==="number");
const ratingLabel = value=>value===undefined?"Pendent":value==="ns"?"Encara no ho sé":VAL[value];
function relevantQuestions(){
  return D.preguntes.filter(q=>S.temes.has(q.tema)||S.imp[q.tema]!==undefined||hasRating(q)||S.vistes.has(q.id)||S.revisar.has(q.id));
}
function importanceText(id){
  const imp=S.imp[id];
  return imp===undefined?"Importància pendent: aquest tema no entra al resultat general.":imp===0?"Importància: Cap. Aquest tema no entra al resultat general.":"Importància que li has donat: "+IMP[imp]+".";
}
function graphSummary(c,{links=true}={}){
  const general=c.gen?`<section class="result general"><h2>Resultat general</h2><p class="imp-note">Ponderat per la importància de ${c.gen.n} ${c.gen.n===1?"tema":"temes"}.</p>${bars(c.gen.amb,c.gen.sense)}</section>`:c.complet?`<p class="coverage partial">No hi ha resultat general: cap tema amb una parella completa té una importància superior a «Cap». ${links?'<a href="#/temes">Revisa els temes i la seva importància</a>.':""}</p>`:"";
  return general+c.temes.filter(t=>t.n).sort((a,b)=>D.temes.findIndex(t=>t.id===a.id)-D.temes.findIndex(t=>t.id===b.id)).map(t=>`<section class="result"><h3>${esc(t.nom)}</h3><p class="imp-note">${importanceText(t.id)} ${t.n} de ${t.total} preguntes valorades en tots dos escenaris.</p>${bars(t.amb,t.sense)}${links?`<a class="small" href="#/valora/${t.id}">Revisa les valoracions de ${esc(t.nom)}</a>`:""}</section>`).join("");
}
function questionDetail(q,{detail=false,personal=true,links=true}={}){
  const r=S.rat[q.id]||{};
  return `<article class="rating-item" data-question="${q.id}"><h3>${esc(q.pregunta)}</h3>
    ${detail&&q.context?`<p class="qctx">${esc(q.context)}</p>`:""}
    ${detail&&q.igual?'<p class="igual">Igual en tots dos escenaris</p>':""}
    <div class="rating-pair">${["amb","sense"].map(side=>`<section class="rating-scenario"><h4>${SC[side]}</h4>${detail?responseBody(q[side]):""}${personal?`<p class="personal-rating"><span>La teva valoració</span><b>${ratingLabel(r[side])}</b></p>`:""}${detail?`<div class="report-sources"><b>Fonts</b><ul>${q[side].fonts.map(f=>{const d=D.docs[f.doc];return `<li>${esc(d.nom)} · ${esc(f.loc)}${d.fitxer?` · <a href="${esc(d.fitxer)}#page=${f.page}">PDF, pàgina ${f.page}</a>`:" · Document de treball, sense enllaç públic."}${f.nota?`<br>${esc(f.nota)}`:""}</li>`;}).join("")}</ul></div>`:""}</section>`).join("")}</div>
    ${detail&&q.mante?`<p class="mante"><b>Què es mantindria</b>${esc(q.mante)}</p>`:""}
    ${detail&&q.pendent?`<p class="pendent-src">${esc(q.pendent)}</p>`:""}
    ${personal&&!completeRating(q)?'<p class="rating-status">Aquesta pregunta no entra al càlcul: cal valorar tots dos escenaris. «Encara no ho sé» no és una valoració numèrica.</p>':""}
    ${links?`<a class="small" href="#/valora/${q.tema}/${pregsDe(q.tema).indexOf(q)+1}">Revisa la pregunta i modifica la valoració →</a>`:""}
  </article>`;
}
function groupedDetails(qs,opts={}){
  return actius().map(t=>{const items=qs.filter(q=>q.tema===t.id);return items.length?`<section class="rating-topic"><div class="rating-topic-head"><h2>${esc(t.nom)}</h2>${opts.personal===false?"":`<p>${importanceText(t.id)}</p>`}</div>${items.map(q=>questionDetail(q,opts)).join("")}</section>`:"";}).join("");
}
function questionList(qs){return `<ul class="list">${qs.map(q=>`<li><a href="#/q/${q.id}">${esc(q.pregunta)}</a></li>`).join("")}</ul>`;}
function exportQuestions(){
  const rated=D.preguntes.filter(hasRating);
  const base=rated.length?rated:D.preguntes.filter(q=>S.vistes.has(q.id));
  const ids=new Set(base.map(q=>q.id));
  if(S.export.extras)relevantQuestions().filter(q=>!completeRating(q)||S.revisar.has(q.id)).forEach(q=>ids.add(q.id));
  return D.preguntes.filter(q=>ids.has(q.id));
}
function exportReport(){
  const qs=exportQuestions(), c=calc(), personal=S.export.personal;
  return `<div class="export-document ${S.export.detail?"document-full":"document-brief"}"><header class="report-heading"><p class="overline">AMB O SENSE · ACORD D'ASSOCIACIÓ ANDORRA–UE</p><h1>${personal?"El teu balanç personal":"Dossier de consulta"}</h1><p>Generat el ${new Date().toLocaleDateString("ca-AD",{day:"numeric",month:"long",year:"numeric"})}. Continguts revisats el ${esc(D.revisio)}.</p><p class="report-disclaimer">Proposta de Solucions Digitals JOA. No és un servei oficial. Continguts pendents de validació.</p><p class="small">${S.export.detail?"Amb les respostes dels dos escenaris, matisos i fonts.":"Resum breu de les preguntes."} ${personal?"Les valoracions són personals; no són una previsió ni una recomanació.":"Sense valoracions, importàncies ni gràfiques personals."}</p></header>
    ${personal&&c.complet?`<p class="coverage">${c.complet} de ${c.total} preguntes valorades en tots dos escenaris. Les incompletes i «Encara no ho sé» no compten.</p>${graphSummary(c,{links:false})}`:""}
    ${qs.length?groupedDetails(qs,{detail:S.export.detail,personal,links:false}):'<p>Encara no hi ha preguntes per incloure. Consulta una pregunta, afegeix una valoració o inclou les pendents.</p>'}
    <footer class="report-footer"><h2>Documents de referència</h2><ul>${Object.values(D.docs).map(d=>`<li><b>${esc(d.nom)}.</b> ${esc(d.autor)}. ${esc(d.versio)}</li>`).join("")}</ul><p>Els textos són resums de consulta. Les fonts originals permeten comprovar-ne el context i l'abast.</p></footer></div>`;
}
P.balanc = ()=>{
  const c=calc(), rated=D.preguntes.filter(hasRating), seen=D.preguntes.filter(q=>S.vistes.has(q.id));
  const review=D.preguntes.filter(q=>S.revisar.has(q.id));
  const pending=relevantQuestions().filter(q=>!completeRating(q)&&!S.revisar.has(q.id));
  return `<div class="wrap narrow balance-page"><div class="pagehead"><div class="crumbs"><a href="#/">Inici</a></div><h1 tabindex="-1">El teu balanç</h1><p>Les teves valoracions, les preguntes consultades i el que vols revisar, en un sol lloc.</p><p class="small">Aquest balanç només es conserva mentre tens la pàgina oberta. Pots desar-ne una còpia en PDF.</p></div>
    ${c.complet?`<div class="coverage ${c.complet<c.total?"partial":""}"><b>Has valorat ${c.complet} de ${c.total} preguntes en tots dos escenaris.</b> ${c.complet<c.total?'Resultat parcial: les incompletes i «Encara no ho sé» no compten.':""}</div>`:`<div class="coverage"><h2>${rated.length?"Encara no hi ha cap parella completa":"Pots fer el teu balanç quan vulguis"}</h2><p>${rated.length?"Les teves respostes apareixen a sota. Per calcular un resultat, cal una valoració numèrica en tots dos escenaris d'una pregunta.":"Aquí pots recuperar les preguntes consultades. Per valorar, obre un tema i, al final, tria «Valora aquest tema». Valorar-les és opcional."}</p><a class="btn sec" href="#/${rated.length?"valora/"+rated[0].tema:"temes"}">${rated.length?"Continua valorant":"Tria un tema per començar"}</a></div>`}
    ${c.complet?'<p class="personal-note"><b>Aquestes notes són les teves.</b> Resumeixen les valoracions que has fet, sobre 10. No són una puntuació oficial de l\'Acord, ni una previsió, ni una recomanació.</p>':""}
    ${graphSummary(c)}
    ${rated.length?`<section class="rating-details" aria-labelledby="rating-title"><div class="section-heading"><div><span class="overline">PREGUNTA PER PREGUNTA</span><h2 id="rating-title">Les teves valoracions</h2></div></div>${groupedDetails(rated)}</section>`:""}
    ${seen.length?`<details ${rated.length?"":"open"}><summary>Preguntes consultades (${seen.length})</summary><div><p class="small muted">Preguntes que has tingut en pantalla. Això no implica que n'hagis llegit totes les respostes.</p>${questionList(seen)}</div></details>`:""}
    ${review.length||pending.length?`<details><summary>Per continuar: preguntes pendents</summary><div>${review.length?`<h2>Marcades per revisar</h2>${questionList(review)}`:""}${pending.length?`<h2>Pendents o «Encara no ho sé»</h2>${questionList(pending)}`:""}</div></details>`:""}
  <details><summary>Com s'ha construït?</summary><div class="method">
    <ol><li>Cada valoració es converteix en un número: molt desfavorable 0, desfavorable 2,5, ni favorable ni desfavorable 5, favorable 7,5, molt favorable 10.</li>
    <li>Només compten les preguntes valorades en tots dos escenaris. «Encara no ho sé» i les pendents no compten, i no es converteixen en un 5.</li>
    <li>La nota d'un tema és la mitjana de les seves preguntes valorades. Totes les preguntes pesen igual.</li>
    <li>El resultat general pondera cada tema per la importància que li has donat: poca 1, mitjana 2, molta 3. «Cap» l'exclou. Un tema amb més preguntes no pesa més.</li>
    <li>L'altre escenari es calcula sobre les mateixes preguntes i amb els mateixos pesos.</li></ol>
    <p><b>Exemple.</b> Dos temes donen 8 i 4 al mateix escenari, amb importància «Molta» i «Poca». El resultat és 7, perquè el primer compta tres vegades i el segon una.</p>
    <table><thead><tr><th>Tema</th><th>Importància</th><th class="n">Nota</th><th class="n">Pes</th></tr></thead><tbody><tr><td>Tema A</td><td>Molta</td><td class="n">8</td><td class="n">3</td></tr><tr><td>Tema B</td><td>Poca</td><td class="n">4</td><td class="n">1</td></tr><tr><td colspan="2"><b>Resultat</b></td><td class="n"><b>7</b></td><td class="n">(8×3 + 4×1) / 4</td></tr></tbody></table>
    <p class="small muted" style="margin:0">Aquesta conversió numèrica és una convenció de l'eina, no una mesura de l'impacte de l'Acord.</p></div></details>
  <div class="actions no-print"><a class="btn" href="#/exporta">Imprimeix o desa en PDF</a><a class="btn sec" href="#/temes">Torna als temes</a><button class="btn link" data-act="esborra">Esborra-ho tot</button></div>
</div>`;
};

P.exporta = ()=>`<div class="wrap narrow export-page"><div class="export-controls no-print"><div class="crumbs"><a href="#/balanc">← Torna al teu balanç</a></div><h1 tabindex="-1">Prepara el teu document</h1><p>Tria el detall i revisa la previsualització abans d'imprimir o desar en PDF.</p><fieldset class="export-level"><legend>Quin detall vols incloure?</legend><label class="export-option"><input type="radio" name="export-detail" id="export-brief" data-export="detail" value="brief" ${S.export.detail?"":"checked"}><span><b>Resum breu</b><small>Preguntes i valoracions, amb les gràfiques i la importància dels temes.</small></span></label><label class="export-option"><input type="radio" name="export-detail" id="export-full" data-export="detail" value="full" ${S.export.detail?"checked":""}><span><b>Amb les respostes · Recomanada</b><small>També els textos dels dos escenaris, les condicions, els matisos i les fonts.</small></span></label></fieldset>
    <label class="export-check"><input type="checkbox" id="export-extras" data-export="extras" ${S.export.extras?"checked":""}><span>Inclou les preguntes pendents de valorar.</span></label>
    <label class="export-check"><input type="checkbox" id="export-personal" data-export="personal" ${S.export.personal?"checked":""}><span>Inclou les meves valoracions personals.</span></label><p class="small muted">Si ho desmarques, també s'exclouen les gràfiques i les importàncies personals. Sense valoracions fetes, s'inclouen les preguntes consultades.</p>
    <p class="export-count" role="status">${exportQuestions().length} preguntes al document.</p><button class="btn" data-act="print" ${exportQuestions().length?"":"disabled"}>Imprimeix o desa en PDF</button><p class="small muted">S'obrirà el diàleg d'impressió del navegador. Per obtenir un PDF, tria «Desa com a PDF».</p><h2 class="preview-label">Previsualització del document</h2></div>${exportReport()}</div>`;

P.test = (scope)=>{
  const t=scope&&tema(scope); if(scope&&(!t||!t.actiu)) return P.nf();
  scope=scope||"";
  if(!S.test||S.test.scope!==scope){
    // Des d'un tema: totes les preguntes d'aquell tema. Sense tema: una per tema, a l'atzar.
    const items=scope?D.test[scope].map((_,i)=>({tema:scope,i,ans:null,done:false}))
      :actius().map(x=>({tema:x.id,i:Math.floor(Math.random()*D.test[x.id].length),ans:null,done:false}));
    S.test={scope,items};
  }
  const it=S.test.items, done=it.filter(x=>x.done), ok=done.filter(x=>x.ans===D.test[x.tema][x.i].c).length;
  return `<div class="wrap narrow">
  <div class="pagehead"><div class="crumbs"><a href="#/">Inici</a>${t?` / <a href="#/tema/${t.id}">${esc(t.nom)}</a>`:""}</div><h1 tabindex="-1">Comprova què has entès${t?`: ${esc(t.nom)}`:""}</h1>
  <p>${t?"Unes quantes preguntes sobre el que acabes de llegir.":"Una pregunta per tema, triada a l'atzar."} No cal fer-la per continuar i el resultat no afecta el teu balanç.</p></div>
  ${it.map((x,k)=>{const Q=D.test[x.tema][x.i];const nm=`t${k}`;
    return `<section class="tq" aria-labelledby="tq${k}"><span class="eyebrow">${esc(tema(x.tema).nom)} · ${k+1} de ${it.length}</span><h2 id="tq${k}">${esc(Q.q)}</h2>
    <fieldset><legend class="sr">Respostes</legend><div class="opts">
    ${[...Q.o,"No ho sé"].map((o,j)=>{const val=j<Q.o.length?j:-1;
      const doc=x.done&&val===Q.c, teva=x.done&&x.ans===val&&val!==Q.c&&val!==-1;
      const marca=doc?`<em class="badge">${x.ans===val?"La teva resposta · ":""}Resposta del document</em>`:teva?`<em class="badge">La teva resposta</em>`:"";
      return `<label class="opt ${doc?"ok":teva?"ko":""}"><input type="radio" name="${nm}" value="${val}" data-test="${k}" ${x.ans===val?"checked":""} ${x.done?"disabled":""}><span>${doc?ico.ok:teva?ico.ko:""}${esc(o)}${marca}</span></label>`}).join("")}
    </div></fieldset>
    ${x.done?`<div class="feedback ${x.ans===Q.c?"ok":x.ans===-1?"":"ko"}" role="status"><p style="margin:0 0 6px"><b>${x.ans===Q.c?"Coincideix amb el document.":x.ans===-1?"Cap problema: aquí tens la resposta.":"No coincideix amb el document."}</b> Segons el document, la resposta és: ${esc(Q.o[Q.c])}.</p><p style="margin:0 0 6px">${esc(Q.e)}</p><a href="#/tema/${x.tema}/${Q.ref}">Torna a la resposta</a></div>`
      :`<div class="actions" style="margin-top:14px"><button class="btn sec" data-act="test-check" data-k="${k}" ${x.ans===null?"disabled":""}>Comprova</button></div>`}
    </section>`}).join("")}
  ${done.length===it.length?`<div class="card" role="status"><h2>Has respost segons el document ${ok} de ${it.length}.</h2><p>Pots tornar a llegir els temes on has dubtat.</p><div class="actions"><button class="btn" data-act="test-new">Fes un altre test</button><a class="btn sec" href="#/${t?"tema/"+t.id:"temes"}">${t?"Torna a "+esc(t.nom):"Torna als temes"}</a></div></div>`:""}
  ${note("D15","Preguntes sobre contingut verificable, amb «No ho sé», explicació i font. Sense cronòmetre, rànquing ni confeti. Verd i vermell només aquí, per a la correcció, i sempre amb icona i text: no depèn del color. Als escenaris no s'hi fan servir mai.")}
</div>`;
};

// Compatibilitat amb els enllaços antics: un únic balanç.
P.resum = ()=>P.balanc();

P.nocanvia = ()=>`<div class="wrap narrow">
  <div class="pagehead"><div class="crumbs"><a href="#/">Inici</a></div><h1 tabindex="-1">Què no canvia, amb o sense Acord</h1>
  <p>Elements que el quadre comparatiu descriu com a iguals en tots dos escenaris.</p></div>
  <div class="card"><ul class="list" style="margin:0">${D.nocanvia.items.map(i=>`<li>${esc(i)}</li>`).join("")}</ul>
  <div class="tags" style="margin-top:12px"><span class="tag nat">Explicació institucional</span></div>
  <button class="btn sec" data-src="nocanvia">Consulta la font</button></div>
  <p>Més informació al web oficial: <a href="https://www.andorraue.ad/ca/" rel="noopener">andorraue.ad</a>.</p>
</div>`;

P.fonts = ()=>`<div class="wrap narrow">
  <div class="pagehead"><div class="crumbs"><a href="#/">Inici</a></div><h1 tabindex="-1">Fonts i metodologia</h1><p>D'on surt cada frase, i com es llegeix.</p></div>
  <div class="card"><h2>Documents de referència</h2><ul class="list">
    <li><b>${esc(D.docs.quadre.nom)}.</b> ${esc(D.docs.quadre.autor)}. Base de tots els resums.</li>
    <li><b>${esc(D.docs.AM.nom)}.</b> ${esc(D.docs.AM.versio)}. <a href="${D.docs.AM.fitxer}" target="_blank" rel="noopener">Obre el PDF</a></li>
    <li><b>${esc(D.docs.PA.nom)}.</b> ${esc(D.docs.PA.versio)}. <a href="${D.docs.PA.fitxer}" target="_blank" rel="noopener">Obre el PDF</a></li></ul></div>
  <div class="card"><h2>Què vol dir cada etiqueta</h2><dl class="gloss" style="margin:0">
    <dt>Previsió del text</dt><dd>El que diu l'articulat de l'Acord.</dd>
    <dt>Explicació institucional</dt><dd>La lectura del Govern sobre què implica, segons el quadre comparatiu.</dd>
    <dt>Estimació d'un estudi</dt><dd>Un efecte previst per un estudi. No és una garantia.</dd>
    <dt>Condició · Termini · Excepció · Incertesa</dt><dd>Matisos que canvien com s'ha de llegir una resposta. Es mostren sempre al costat de la resposta.</dd></dl></div>
  <div class="card"><h2>Com es redacten els resums</h2><ul class="list" style="margin:0">
    <li>Cada resum correspon a un fragment identificat del quadre comparatiu.</li>
    <li>La mateixa terminologia per als dos escenaris, i cap adjectiu valoratiu.</li>
    <li>Els resums els proposa l'equip del projecte i els valida la Secretaria d'Estat per a les Relacions amb la UE.</li>
    <li>Estat a la demo: <b>pendent de validació</b>. Última revisió: ${esc(D.revisio)}.</li></ul></div>
  ${note("D10 · D19","Dues dimensions separades: naturalesa de l'afirmació i qualificadors. La unitat de revisió editorial és la parella comparativa.")}
</div>`;

P.privacitat = ()=>`<div class="wrap narrow">
  <div class="pagehead"><div class="crumbs"><a href="#/">Inici</a></div><h1 tabindex="-1">Com es tracta la teva informació</h1>
  <p>Les teves tries, valoracions i respostes no surten del teu navegador: no es desen ni s'envien enlloc.</p></div>
  <div class="card"><h2>El que fa aquesta eina</h2><ul class="list" style="margin:0">
    <li>No et demana cap dada: ni nom, ni correu, ni edat, ni nacionalitat.</li>
    <li>Els temes que tries, les valoracions, el balanç i el test es calculen al navegador. Quan tanques o recarregues la pàgina, desapareixen.</li>
    <li>No fa servir galetes, analítica ni recursos de tercers, i no desa res al dispositiu.</li>
    <li>El servidor no sap quins temes consultes: la part de l'adreça que ho indica, després del símbol «#», els navegadors no l'envien mai.</li>
    <li>Els enllaços compartits obren una pregunta pública, mai les teves valoracions.</li></ul>
    <div class="actions" style="margin-top:16px"><button class="btn sec" data-act="esborra">Esborra ara les meves respostes</button></div></div>
  <div class="card"><h2>Com ho pots comprovar</h2><ol class="list" style="margin:0">
    <li><b>Mode avió.</b> Un cop carregada la pàgina, activa el mode avió i fes servir l'eina sencera. Funciona igual, perquè no necessita enviar res.</li>
    <li><b>Eines del navegador.</b> A la pestanya de xarxa no hi apareix cap petició quan tries temes, valores o fas el test. A la d'emmagatzematge no hi ha cap galeta ni cap dada desada.</li></ol></div>
  <div class="card"><h2>L'allotjament d'aquesta demo</h2><p>Quan visites la demo publicada a GitHub Pages, el servei rep la teva adreça IP i, segons la seva documentació, la registra per motius de seguretat. Això és independent de les tries i valoracions que fas dins de l'eina.</p><p style="margin:0">Més informació: <a href="https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages#data-collection" rel="noopener">recollida de dades a GitHub Pages</a> i <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" rel="noopener">política de privadesa de GitHub</a>.</p></div>
  <div class="card"><h2>La privacitat de la versió definitiva</h2><p>El domini i l'allotjament definitius encara estan per confirmar. L'eina podria publicar-se en un domini propi.</p><p style="margin:0">Abans de posar-la en servei, aquest apartat s'actualitzarà amb la política de privadesa aplicable: qui és el responsable del tractament, com contactar-hi, quines dades registra l'allotjament, amb quina finalitat i durant quant de temps es conserven, i com exercir els teus drets. Aquesta demo no pressuposa que li sigui aplicable la política d'andorraue.ad.</p></div>
  ${note("D18","Les tries i valoracions es processen al navegador. Els registres de l'allotjament són un tractament diferent. La informació de la versió definitiva s'ha de validar segons el servei i l'allotjament acordats; el nom del domini no determina per si sol qui n'és el responsable.")}
</div>`;

P.glossari = ()=>`<div class="wrap narrow"><div class="pagehead"><div class="crumbs"><a href="#/">Inici</a></div><h1 tabindex="-1">Glossari</h1></div>
  <div class="card"><dl class="gloss" style="margin:0">${D.glossari.map(g=>`<dt>${esc(g.t)}</dt><dd>${esc(g.d)}</dd>`).join("")}</dl></div></div>`;

P.nf = ()=>`<div class="wrap narrow"><h1 tabindex="-1">Aquesta pàgina no existeix</h1><p><a href="#/">Torna a l'inici</a></p></div>`;

/* ---------- Panell de fonts ---------- */
let lastFocus=null;
function openSrc(key){
  let frags,title;
  if(key==="nocanvia"){frags=D.nocanvia.fonts;title="Què no canvia";}
  else{const [id,side]=key.split(":");const q=preg(id);frags=q[side].fonts;title=`${SC[side]} · ${q.pregunta}`;}
  lastFocus=document.activeElement;
  const html=`<div class="scrim" data-act="close-src"></div>
  <div class="panel" role="dialog" aria-modal="true" aria-labelledby="src-t">
    <header><h2 id="src-t">Font</h2><button class="btn sec" data-act="close-src">Torna a la pregunta</button></header>
    <div class="body"><p class="small muted" style="margin-top:0">${esc(title)}</p>
    ${frags.map(f=>{const d=D.docs[f.doc];return `<div class="frag"><div class="meta"><span class="tag nat">${esc(d.naturalesa)}</span><p style="margin:8px 0 0"><b>${esc(d.nom)}</b></p><dl><dt>Autor</dt><dd>${esc(d.autor)}</dd><dt>Versió</dt><dd>${esc(d.versio)}</dd><dt>Localitzador</dt><dd>${esc(f.loc)}</dd></dl></div>
      <blockquote><span class="sr">Fragment de la font: </span>${esc(f.text)}</blockquote>
      ${f.nota?`<p class="fnote">${esc(f.nota)}</p>`:""}
      <p class="flink small">${d.fitxer?`<a href="${d.fitxer}#page=${f.page}" target="_blank" rel="noopener">Obre el document complet a la pàgina ${f.page}</a>`:"Document de treball de la Secretaria d'Estat. A la versió pública s'enllaçarà la versió publicada."}</p></div>`}).join("")}
    <p class="who">Fragment de la font: text original, sense modificar.<br>Resum redactat per l'equip del projecte · Validació de la Secretaria d'Estat: pendent · Revisat el ${esc(D.revisio)}.</p>
    ${note("D10","Cada font mostra document, autor, versió, localitzador i fragment. Si el resum combina fragments, es mostren tots. Es distingeix qui ha escrit el document, qui ha fet el resum i qui l'ha validat.")}
    </div></div>`;
  const box=document.createElement("div");box.id="src";box.innerHTML=html;document.body.appendChild(box);
  document.body.style.overflow="hidden";
  $("#src .panel header .btn").focus();
}
function closeSrc(){const b=$("#src");if(!b)return;b.remove();document.body.style.overflow="";if(lastFocus&&document.contains(lastFocus))lastFocus.focus();}

/* ---------- Utilitats ---------- */
function toast(msg){let t=$(".toast");if(t)t.remove();t=document.createElement("div");t.className="toast";t.setAttribute("role","status");t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),3200);}
function copy(text){
  const done=()=>toast("Enllaç copiat. Obre la pregunta, sense les teves valoracions.");
  if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(text).then(done,()=>fallback());}else fallback();
  function fallback(){const i=document.createElement("textarea");i.value=text;i.style.position="fixed";i.style.opacity="0";document.body.appendChild(i);i.select();try{document.execCommand("copy");done();}catch(e){toast("Copia aquest enllaç: "+text);}i.remove();}
}
function reset(){searchTerm="";S.temes.clear();S.sit.clear();S.val=false;S.imp={};S.rat={};S.vistes.clear();S.revisar.clear();S.test=null;S.export={detail:true,extras:false,personal:true};toast("Fet. No queda res guardat.");}

let questionObserver=null;
function observeQuestions(){
  if(!window.IntersectionObserver)return;
  questionObserver=new window.IntersectionObserver(entries=>{
    if(document.hidden)return;
    entries.forEach(entry=>{if(entry.isIntersecting&&entry.intersectionRatio>=0.5){const id=entry.target.id.slice(2);if(preg(id))S.vistes.add(id);questionObserver.unobserve(entry.target);}});
  },{threshold:0.5});
  $$(".qcard .q").forEach(el=>questionObserver.observe(el));
}
function preparePrint(){
  if(!["#/balanc","#/resum","#/exporta"].includes(location.hash))return;
  let report=$("#print-report");
  if(!report){report=document.createElement("div");report.id="print-report";document.body.appendChild(report);}
  report.innerHTML=exportReport();
  document.body.classList.add("printing-report");
}
function finishPrint(){document.body.classList.remove("printing-report");$("#print-report")?.remove();}
window.addEventListener("beforeprint",preparePrint);
window.addEventListener("afterprint",finishPrint);

/* ---------- Router ---------- */
function route(){
  finishPrint();
  const h=(location.hash||"#/").slice(2).split("/");
  let html,cur;
  switch(h[0]){
    case "":cur="";html=P.inici();break;
    case "cerca":cur="";html=P.cerca();break;
    case "situacio":case "temes":cur="temes";html=P.temes();break;
    case "valora":cur="temes";html=P.valora(h[1],h[2]);break;
    case "tema":cur="temes";html=P.tema(h[1]);break;
    case "q":cur="temes";html=P.pregunta(h[1]);break;
    case "balanc":cur="balanc";html=P.balanc();break;
    case "test":cur="test";html=P.test(h[1]);break;
    case "resum":cur="balanc";html=P.balanc();break;
    case "exporta":cur="balanc";html=P.exporta();break;
    case "no-canvia":cur="";html=P.nocanvia();break;
    case "fonts":cur="fonts";html=P.fonts();break;
    case "privacitat":cur="";html=P.privacitat();break;
    case "glossari":cur="fonts";html=P.glossari();break;
    default:html=P.nf();
  }
  closeSrc();
  questionObserver?.disconnect();
  const mb=$(".menu-btn");if(mb){mb.setAttribute("aria-expanded","false");$("#menu").classList.remove("open");}
  $("#app").classList.toggle("home-main",h[0]==="");
  $("#app").innerHTML=html;
  observeQuestions();
  document.title=(h[0]===""?"Amb o sense · Què canviaria amb l’Acord?":($("#app h1")?.textContent||"Amb o sense")+" · Amb o sense");
  $$(".top nav a").forEach(a=>{if(a.dataset.nav===cur)a.setAttribute("aria-current","page");else a.removeAttribute("aria-current");});
  if(h[0]==="tema"&&h[2]){const el=$("#q-"+h[2]);if(el){el.scrollIntoView();$("#h-"+h[2]).focus({preventScroll:true});return;}}
  window.scrollTo(0,0);
  const f=$("#app h1");if(f)f.focus({preventScroll:true});
}
function rerender(keepScroll=true){const y=window.scrollY;const a=document.activeElement;const key=a&&(a.dataset.rate||a.dataset.imp||a.dataset.test!==undefined)?(a.name+"|"+a.value):null;const focusId=a?.id;const focusAct=a?.dataset.act;route();if(keepScroll)window.scrollTo(0,y);if(key){const [n,v]=key.split("|");const el=$(`input[name="${n}"][value="${v}"]`);if(el)el.focus({preventScroll:true});}else if(focusId){document.getElementById(focusId)?.focus({preventScroll:true});}}

/* ---------- Esdeveniments ---------- */
document.addEventListener("submit",e=>{
  if(!e.target.matches(".search-form"))return;
  e.preventDefault();
  searchTerm=new FormData(e.target).get("question").trim().slice(0,120);
  if(location.hash==="#/cerca")route();else location.hash="#/cerca";
});
document.addEventListener("click",e=>{
  const src=e.target.closest("[data-src]");if(src){const id=src.dataset.src.split(":")[0];if(preg(id))S.vistes.add(id);openSrc(src.dataset.src);return;}
  const a=e.target.closest("[data-act]");if(!a)return;
  const act=a.dataset.act, qid=a.dataset.q;
  if(act==="close-src")closeSrc();
  else if(act==="share"){const u=location.href.split("#")[0]+"#/q/"+qid;copy(u);}
  else if(act==="rev"){S.revisar.has(qid)?S.revisar.delete(qid):S.revisar.add(qid);rerender();}
  else if(act==="test-check"){const k=+a.dataset.k;S.test.items[k].done=true;rerender();}
  else if(act==="test-new"){S.test=null;rerender(false);}
  else if(act==="esborra"){reset();rerender(false);}
  else if(act==="print"){preparePrint();window.print();}
  else if(act==="menu"){const open=a.getAttribute("aria-expanded")!=="true";a.setAttribute("aria-expanded",open);$("#menu").classList.toggle("open",open);}
});
document.addEventListener("change",e=>{
  const t=e.target;
  if(t.dataset.export){S.export[t.dataset.export]=t.dataset.export==="detail"?t.value==="full":t.checked;rerender();}
  else if(t.dataset.imp){S.imp[t.dataset.imp]=+t.value;rerender();}
  else if(t.dataset.rate){const [q,side]=t.dataset.rate.split(":");S.vistes.add(q);S.rat[q]=S.rat[q]||{};S.rat[q][side]=t.value==="ns"?"ns":+t.value;rerender();}
  else if(t.dataset.test!==undefined){const k=+t.dataset.test;S.test.items[k].ans=+t.value;rerender();}
});
document.addEventListener("keydown",e=>{
  if(e.key==="Escape"&&$("#src")){closeSrc();return;}
  if(e.key==="Escape"&&$("#menu.open")){$("#menu").classList.remove("open");const mb=$(".menu-btn");mb.setAttribute("aria-expanded","false");mb.focus();return;}
  if(e.key==="Tab"&&$("#src")){const f=$$("#src a, #src button");if(!f.length)return;const first=f[0],last=f[f.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
});
window.addEventListener("hashchange",route);
route();
})();
