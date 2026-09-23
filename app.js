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

const S = {temes:new Set(), sit:new Set(), val:false, imp:{}, rat:{}, vistes:new Set(), revisar:new Set(), test:null, inclouVal:true};
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
const note = (d,txt)=>`<aside class="dnote" aria-label="Nota de disseny"><b>${esc(d)}</b> · ${txt}</aside>`;

/* ---------- Components ---------- */
function qcard(q,{standalone=false}={}){
  const t = tema(q.tema);
  const H = standalone?"h1":"h2";
  const scen = side=>{
    const s=q[side];
    const tab = s.taula?`<table class="minitab"><caption>${esc(s.taula.titol)}</caption><tbody>${s.taula.files.map(f=>`<tr><td>${esc(f[0])}</td><td>${esc(f[1])}</td></tr>`).join("")}</tbody></table><p class="note-src">${esc(s.taula.nota)}</p>`:"";
    const quals = s.qual.map(x=>`<div class="qual"><b>${esc(x.tipus)}</b>${esc(x.text)}</div>`).join("");
    return `<section class="scen" aria-label="${SC[side]}">
      <h4>${glyph(side)}${SC[side]}</h4>
      <p class="resp">${esc(s.text)}</p>${tab}${quals}
      <div class="tags" aria-label="Naturalesa de la informació">${s.naturalesa.map(n=>`<span class="tag nat">${esc(n)}</span>`).join("")}</div>
      <button class="btn sec srcbtn" data-src="${q.id}:${side}">Consulta la font<span class="sr"> de «${SC[side]}»: ${esc(q.pregunta)}</span></button>
    </section>`;
  };
  const r = S.rat[q.id]||{};
  const rate = S.val?`<div class="rate"><p>Per a tu, com valores aquest punt en cada escenari?</p><div class="rate-grid">${["amb","sense"].map(side=>`
      <fieldset><legend>${SC[side]}${r[side]===undefined?'<span class="pend">Pendent</span>':""}</legend><div class="radios">
      ${VAL.map((v,i)=>`<label class="radio"><input type="radio" name="r-${q.id}-${side}" value="${i}" data-rate="${q.id}:${side}" ${r[side]===i?"checked":""}><span>${v}</span></label>`).join("")}
      <label class="radio ns"><input type="radio" name="r-${q.id}-${side}" value="ns" data-rate="${q.id}:${side}" ${r[side]==="ns"?"checked":""}><span>Encara no ho sé</span></label>
      </div></fieldset>`).join("")}</div></div>`:"";
  const rev = S.revisar.has(q.id);
  return `<article class="qcard" id="q-${q.id}" aria-labelledby="h-${q.id}">
    <div class="qhead"><span class="eyebrow" style="margin:0">${esc(t.nom)}</span><span class="qid">Pregunta ${q.id}</span></div>
    <${H} class="q" id="h-${q.id}" tabindex="-1">${esc(q.pregunta)}</${H}>
    ${q.context?`<p class="qctx">${esc(q.context)}</p>`:""}
    ${q.igual?`<p class="igual">${mark("glyph")} Igual en tots dos escenaris</p>`:""}
    <div class="pair">${scen("amb")}${scen("sense")}</div>
    ${q.mante?`<div class="mante"><b>Què es mantindria</b>${esc(q.mante)}</div>`:""}
    ${q.pendent?`<p class="pendent-src">${esc(q.pendent)}</p>`:""}
    ${rate}
    <div class="qfoot">
      ${S.val?"":`<button class="btn link" data-act="val-on" data-q="${q.id}">Valora aquest punt</button>`}
      <button class="btn link" data-act="share" data-q="${q.id}">Comparteix aquesta pregunta</button>
      <button class="btn link" data-act="rev" data-q="${q.id}" aria-pressed="${rev}">${rev?"Marcada per revisar":"Ho vull revisar"}</button>
    </div>
  </article>`;
}

function impBlock(tid){
  const v=S.imp[tid];
  return `<div class="imp"><fieldset><legend>Quanta importància té aquest tema per a tu?${v===undefined?'<span class="pend">Pendent</span>':""}</legend>
  <div class="radios">${IMP.map((x,i)=>`<label class="radio"><input type="radio" name="imp-${tid}" value="${i}" data-imp="${tid}" ${v===i?"checked":""}><span>${x}</span></label>`).join("")}</div>
  <p class="small muted" style="margin:10px 0 0">«Cap» treu aquest tema del resultat general. La importància decideix quant pesa el tema, no quantes preguntes té.</p></fieldset></div>`;
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
const topicHooks = {habitatge:"Residents, inversió i habitatge",treball:"Drets laborals i feina a Europa",sobirania:"Les lleis i qui les decideix"};
let searchTerm = "";
const normalize = s=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
function searchForm(value=""){
  return `<form class="search-form" role="search"><label class="sr" for="question-search">Cerca entre les preguntes de la demo</label><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg><input id="question-search" name="question" type="search" maxlength="120" placeholder="Què vols saber? P. ex. feina, residents, lleis…" value="${esc(value)}"><button class="btn" type="submit">Cerca ${arrow}</button></form>`;
}

P.inici = ()=>`
<div class="home">
  <section class="home-hero" aria-labelledby="home-title">
    <div class="wrap hero-grid">
      <div class="hero-copy">
        <p class="overline"><span class="tiny-mark" aria-hidden="true">↔</span> L'Acord d'associació Andorra–UE</p>
        <h1 id="home-title" tabindex="-1">L'Acord.<br>A la <em>teva vida.</em></h1>
        <p class="hero-intro">Què canviaria? Què es mantindria?<br>Compara els dos escenaris i forma't el teu criteri.</p>
        <a class="hero-link" href="#/situacio">Troba els temes que t'afecten <span aria-hidden="true">→</span></a>
      </div>
      <div class="hero-topics">
        <div class="section-kicker"><span>COMENÇA PEL QUE T'IMPORTA</span><span>01 — 03</span></div>
        ${actius().map((t,i)=>`<a class="topic-entry" href="#/tema/${t.id}"><span class="topic-icon">${topicIcon(t.id)}</span><span class="topic-entry-text"><b>${esc(t.nom)}</b><span>${esc(topicHooks[t.id])}</span></span><span class="topic-arrow" aria-hidden="true">↗</span></a>`).join("")}
        <a class="all-topics" href="#/temes/explora">Explora els 15 àmbits <span>3 disponibles a la demo →</span></a>
      </div>
    </div>
    <div class="wrap hero-bottom"><span>Una pregunta. Dos escenaris. <b>El teu criteri.</b></span><a href="#/privacitat">Sense registre. Les teves tries es queden aquí. ${arrow}</a></div>
  </section>

  <div class="wrap">
    <section class="find-question" aria-label="Troba una pregunta">${searchForm()}<p>Cerca en les 11 preguntes d'Habitatge, Treball i Sobirania.</p></section>
    <section class="home-comparison" aria-labelledby="example-title">
      <div class="section-heading"><div><span class="overline">DE LA PREGUNTA ALS FETS</span><h2 id="example-title">Posa els dos escenaris<br>l'un al costat de l'altre.</h2></div><p>Aquí tens un exemple.<br>La font original, sempre a un clic.</p></div>
      ${qcard(preg("T3"))}
      ${note("D02 · D08", "Els temes són accessibles a la primera pantalla. L'exemple conserva els textos, les fonts i el mateix tractament visual per als dos escenaris.")}
    </section>
    <section class="next-steps" aria-label="Continua explorant">
      <a href="#/no-canvia"><span class="step-number">01 / ENTÉN</span><h2>I què no canviaria?</h2><p>També hi ha punts que es mantenen en tots dos escenaris.</p><span class="step-link">Mira què es mantindria ${arrow}</span></a>
      <a href="#/test"><span class="step-number">02 / COMPROVA</span><h2>Ho tens clar?</h2><p>Posa a prova el que has entès. Amb explicacions i fonts.</p><span class="step-link">Prova el test ${arrow}</span></a>
      <a href="#/balanc"><span class="step-number">03 / VALORA, SI VOLS</span><h2>El balanç és teu.</h2><p>Tu decideixes què t'importa i com valores cada escenari.</p><span class="step-link">Construeix el teu balanç ${arrow}</span></a>
    </section>
    <section class="proces" aria-labelledby="pr">
      <div class="section-heading"><div><span class="overline">EL CONTEXT</span><h2 id="pr">On som del procés?</h2></div><p>Revisat el ${esc(D.revisio)}.<br>Font: <a href="https://www.andorraue.ad/ca/" rel="noopener">andorraue.ad</a></p></div>
      <ol>${D.proces.map(p=>`<li class="${p[2]}"><time>${esc(p[0])}</time>${esc(p[1])}<div class="estat">${p[2]==="fet"?"Fet":"Previst"}</div></li>`).join("")}</ol>
      ${note("D05 · E08","Signatura, ratificació i entrada en vigor es distingeixen. Cap compte enrere.")}
    </section>
  </div>
</div>`;

P.cerca = ()=>{
  const terms=normalize(searchTerm).trim().split(/\s+/).filter(Boolean);
  const matches=terms.length?D.preguntes.filter(q=>{
    const haystack=normalize([tema(q.tema).nom,q.pregunta,q.context,q.amb.text,q.sense.text,...q.amb.qual.map(x=>x.text),...q.sense.qual.map(x=>x.text)].join(" "));
    return terms.every(t=>haystack.includes(t));
  }):D.preguntes;
  return `<div class="wrap narrow"><div class="pagehead"><div class="crumbs"><a href="#/">Inici</a> / Cerca</div><span class="overline">DE LA PREGUNTA ALS FETS</span><h1 tabindex="-1">Què vols saber?</h1><p>Cerca entre les 11 preguntes disponibles en aquesta demo.</p></div>${searchForm(searchTerm)}<p class="search-count" role="status">${matches.length} ${matches.length===1?"pregunta trobada":"preguntes trobades"}</p><div class="search-results">${matches.map(q=>`<a href="#/q/${q.id}"><span class="overline">${esc(tema(q.tema).nom)} · ${q.id}</span><h2>${esc(q.pregunta)}</h2><span class="step-link">Compara els escenaris ${arrow}</span></a>`).join("")||`<div class="card"><h2>No hem trobat cap pregunta.</h2><p>Prova una paraula més general, com «feina», «residents» o «lleis». La demo només inclou tres temes.</p><a href="#/temes/explora">Explora els àmbits disponibles →</a></div>`}</div></div>`;
};

P.situacio = ()=>{
  const prop = new Set(); S.sit.forEach(i=>D.situacions[i].temes.forEach(t=>prop.add(t)));
  const list=[...prop].map(tema);
  return `<div class="wrap narrow">
  <div class="pagehead"><div class="crumbs"><a href="#/">Inici</a></div>
    <h1 tabindex="-1">Què descriu la teva situació?</h1>
    <p>Marca tantes opcions com vulguis. Només serveixen per proposar-te temes. No es guarden ni s'envien. Pots saltar aquest pas.</p></div>
  <div class="chips" role="group" aria-label="Situacions">
    ${D.situacions.map((s,i)=>`<span class="chip"><input type="checkbox" id="sit${i}" data-sit="${i}" ${S.sit.has(i)?"checked":""} ${s.actiu?"":"disabled"}><label for="sit${i}"><span class="tick">✓</span>${esc(s.nom)}${s.actiu?"":' <span class="small">· versió completa</span>'}</label></span>`).join("")}
  </div>
  <div class="proposal" aria-live="polite">
    ${list.length?`<p style="margin:0 0 8px"><b>Temes proposats</b></p><p style="margin:0">${list.map(t=>t.actiu?`<b>${esc(t.nom)}</b>`:`${esc(t.nom)} <span class="muted small">(versió completa)</span>`).join(" · ")}</p>`:`<p class="muted" style="margin:0">Encara no has marcat cap situació.</p>`}
  </div>
  <div class="actions"><button class="btn" data-act="sit-go">Veure els temes proposats</button><a class="btn link" href="#/temes">Salta i tria tu els temes</a></div>
  ${note("D08","Les situacions proposen temes, i es poden modificar. No assignen pesos ni opinions, i no es demana nacionalitat, edat ni vot. Quatre actives a la demo.")}
</div>`;
};

P.temes = (mode)=>{
  const explora = mode==="explora";
  const fams=[...new Set(D.temes.map(t=>t.familia))];
  const n=[...S.temes].length;
  return `<div class="wrap">
  <div class="pagehead"><div class="crumbs"><a href="#/">Inici</a></div>
    <h1 tabindex="-1">${explora?"Tots els àmbits":"Quins temes vols entendre millor?"}</h1>
    <p>${explora?"Obre qualsevol àmbit directament, sense passos previs.":"Pots començar amb dos o tres temes i afegir-ne més després."} <a href="#/temes${explora?"":"/explora"}">${explora?"Prefereixo triar-ne uns quants":"Veure'ls tots com a índex"}</a></p></div>
  ${fams.map(f=>`<section class="family" aria-labelledby="f-${f.replace(/\W/g,"")}"><h2 id="f-${f.replace(/\W/g,"")}">${esc(f)}</h2><div class="tgrid">
    ${D.temes.filter(t=>t.familia===f).map(t=>{
      if(!t.actiu) return `<div class="tcard off"><span class="nom">${esc(t.nom)}</span><span class="fr">${esc(t.frase)}</span><span class="soon">Disponible a la versió completa</span></div>`;
      if(explora) return `<div class="tcard"><span class="nom">${esc(t.nom)}</span><span class="fr">${esc(t.frase)}</span><a class="open" href="#/tema/${t.id}">Obre ${esc(t.nom)} · ${pregsDe(t.id).length} preguntes</a></div>`;
      const on=S.temes.has(t.id);
      return `<label class="tcard ${on?"on":""}"><input type="checkbox" data-tema="${t.id}" ${on?"checked":""}><span class="box">${check}</span><span class="nom">${esc(t.nom)}</span><span class="fr">${esc(t.frase)}</span><span class="state">${on?"Seleccionat":pregsDe(t.id).length+" preguntes"}</span></label>`;
    }).join("")}</div></section>`).join("")}
  ${note("D08","Quatre famílies de navegació, no una classificació jurídica. El catàleg no es reordena en seleccionar. Els temes no disponibles expliquen el motiu.")}
  </div>
  ${explora?"":`<div class="bar-bottom"><div class="wrap"><span aria-live="polite"><b>${n}</b> ${n===1?"tema seleccionat":"temes seleccionats"}</span><button class="btn" data-act="temes-go" ${n?"":"disabled"}>${n?"Comença la comparativa":"Tria almenys un tema"}</button></div></div>`}`;
};

P.tema = (id)=>{
  const t=tema(id); if(!t||!t.actiu) return P.nf();
  const qs=pregsDe(id); qs.forEach(q=>S.vistes.add(q.id));
  const sel=[...S.temes].filter(x=>tema(x).actiu); const seq=sel.includes(id)?sel:[id,...sel];
  const nxt=seq[seq.indexOf(id)+1];
  return `<div class="wrap"><div class="tema-layout">
  <nav class="side" aria-label="Preguntes del tema">
    <h2>${esc(t.nom)}</h2><ol>${qs.map(q=>`<li><a href="#/tema/${id}/${q.id}" data-jump="${q.id}">${esc(q.pregunta)}</a></li>`).join("")}</ol>
    ${seq.length>1?`<h2>Els teus temes</h2><ol>${seq.map(x=>`<li><a href="#/tema/${x}" aria-current="${x===id}">${esc(tema(x).nom)}</a></li>`).join("")}</ol>`:""}
  </nav>
  <div>
    <div class="pagehead"><div class="crumbs"><a href="#/">Inici</a> · <a href="#/temes">Temes</a> · ${esc(t.familia)}</div>
      <span class="topic-heading-icon">${topicIcon(t.id)}</span><h1 tabindex="-1">${esc(t.nom)}</h1><p class="intro">${esc(t.intro)}</p><span class="topic-meta">${qs.length} preguntes · Dos escenaris · Fonts consultables</span></div>
    <details class="question-index"><summary>Les ${qs.length} preguntes d’aquest tema</summary><div><ol>${qs.map(q=>`<li><a href="#/tema/${id}/${q.id}">${esc(q.pregunta)}</a></li>`).join("")}</ol></div></details>
    <div class="valtoggle"><label class="switch"><input type="checkbox" data-act="val" ${S.val?"checked":""}><span class="trk"></span><span><b>Afegeix la teva valoració</b> <span class="muted">· opcional</span></span></label>
      <span class="small muted">${S.val?"Pots deixar qualsevol punt pendent.":"Llegir i comparar ja és una experiència completa."}</span></div>
    ${note("D12","Llegir no exigeix puntuar. La capa de valoració s'activa expressament. Importància per tema, valoració independent de cada escenari, cap resposta preseleccionada.")}
    ${S.val?impBlock(id):""}
    ${qs.map(q=>qcard(q)).join("")}
    ${note("D09 · D10","Una pregunta, dos escenaris visibles amb la mateixa jerarquia. En mòbil s'apilen i repeteixen l'etiqueta. La naturalesa de cada afirmació és textual; les condicions i terminis no s'amaguen.")}
    <div class="nextnav">
      ${nxt?`<a class="btn" href="#/tema/${nxt}">Següent tema: ${esc(tema(nxt).nom)}</a>`:`<a class="btn" href="#/${S.val?"balanc":"test"}">${S.val?"Veure el teu balanç":"Comprova què has entès"}</a>`}
      <a class="btn sec" href="#/resum">El teu recorregut</a>
    </div>
  </div></div></div>`;
};

P.pregunta = (id)=>{
  const q=preg(id); if(!q) return P.nf(); S.vistes.add(id);
  return `<div class="wrap narrow" style="max-width:1000px">
  <div class="crumbs"><a href="#/">Amb o sense</a> · <a href="#/tema/${q.tema}">${esc(tema(q.tema).nom)}</a></div>
  <p class="small muted" style="margin:0 0 16px">Comparativa dels escenaris amb i sense Acord d'associació Andorra–UE. Servei informatiu del Govern d'Andorra. Revisat el ${esc(D.revisio)}.</p>
  ${qcard(q,{standalone:true})}
  ${note("D17","Enllaç directe a una pregunta: mostra servei, responsable, els dos escenaris i la data, sense passar per la portada. L'enllaç no porta valoracions.")}
  <div class="actions"><a class="btn" href="#/tema/${q.tema}">Totes les preguntes de ${esc(tema(q.tema).nom)}</a><a class="btn sec" href="#/temes/explora">Altres temes</a></div>
</div>`;
};

P.balanc = ()=>{
  const c=calc();
  const partial=c.complet<c.total;
  const cov = c.complet===0
    ? `<div class="coverage"><p style="margin:0 0 12px"><b>Encara no has completat cap parella de valoracions.</b></p><p style="margin:0 0 16px">Una parella és una pregunta valorada en tots dos escenaris. Sense cap parella no hi ha resultat, ni tampoc empat.</p><a class="btn" href="#/tema/${[...S.temes][0]||"habitatge"}" data-act="val-on-nav">Comença a valorar</a></div>`
    : `<div class="coverage ${partial?"partial":""}"><p style="margin:0"><b>Has valorat ${c.complet} de ${c.total} parelles dels teus temes.</b>${partial?" Resultat parcial: les preguntes pendents i les marcades amb «Encara no ho sé» no compten.":""}</p></div>`;
  const gen = c.gen?`<section class="result general" aria-labelledby="rg"><h2 id="rg">Resultat general</h2><p class="imp-note">Ponderat per la importància que has donat a ${c.gen.n===1?"1 tema":c.gen.n+" temes"}.</p>${bars(c.gen.amb,c.gen.sense)}</section>`
    : (c.complet?`<div class="coverage partial"><p style="margin:0">Per veure el resultat general, indica la importància dels temes que has valorat.</p></div>`:"");
  const per = c.temes.filter(t=>t.n).map(t=>`<section class="result" aria-labelledby="rt-${t.id}"><h3 id="rt-${t.id}">${esc(t.nom)}</h3>
    <p class="imp-note">${t.imp===undefined?"Importància pendent: aquest tema no entra al resultat general.":t.imp===0?"Importància «Cap»: aquest tema no entra al resultat general.":"Importància: "+IMP[t.imp]+"."} ${t.n} de ${t.total} parelles valorades.</p>${bars(t.amb,t.sense)}
    <p class="small" style="margin:10px 0 0"><a href="#/tema/${t.id}">Revisa les valoracions de ${esc(t.nom)}</a></p></section>`).join("");
  return `<div class="wrap narrow">
  <div class="pagehead"><div class="crumbs"><a href="#/">Inici</a></div><h1 tabindex="-1">El teu balanç personal</h1>
  <p>Aquest resultat resumeix les teves valoracions. Pots revisar-les.</p></div>
  ${cov}${gen}${per}
  ${c.complet?`<p class="stable">No és una previsió, ni una probabilitat, ni una recomanació. Dues notes altes o dues notes baixes són possibles: cada escenari es valora per separat.</p>`:""}
  ${note("D13","Dues barres independents, mateixa escala 0–10, mateix color, valor escrit. Primer la cobertura, després els resultats. Sense guanyador, sense balança, sense 5/10 per defecte.")}
  <details><summary>Com s'ha construït?</summary><div class="method">
    <ol><li>Cada valoració es converteix en un número: molt desfavorable 0, desfavorable 2,5, ni favorable ni desfavorable 5, favorable 7,5, molt favorable 10.</li>
    <li>Només compten les preguntes valorades en tots dos escenaris. «Encara no ho sé» i les pendents no compten, i no es converteixen en un 5.</li>
    <li>La nota d'un tema és la mitjana de les seves preguntes valorades. Totes les preguntes pesen igual.</li>
    <li>El resultat general pondera cada tema per la importància que li has donat: poca 1, mitjana 2, molta 3. «Cap» l'exclou. Un tema amb més preguntes no pesa més.</li>
    <li>L'altre escenari es calcula sobre les mateixes preguntes i amb els mateixos pesos.</li></ol>
    <p><b>Exemple.</b> Dos temes donen 8 i 4 al mateix escenari, amb importància «Molta» i «Poca». El resultat és 7, perquè el primer compta tres vegades i el segon una.</p>
    <table><thead><tr><th>Tema</th><th>Importància</th><th class="n">Nota</th><th class="n">Pes</th></tr></thead><tbody><tr><td>Tema A</td><td>Molta</td><td class="n">8</td><td class="n">3</td></tr><tr><td>Tema B</td><td>Poca</td><td class="n">4</td><td class="n">1</td></tr><tr><td colspan="2"><b>Resultat</b></td><td class="n"><b>7</b></td><td class="n">(8×3 + 4×1) / 4</td></tr></tbody></table>
    <p class="small muted" style="margin:0">Aquesta conversió numèrica és una convenció de l'eina, no una mesura de l'impacte de l'Acord.</p></div></details>
  <div class="actions no-print" style="margin-top:8px"><a class="btn" href="#/resum">Descarrega el resum</a><a class="btn sec" href="#/temes">Continua llegint</a><button class="btn link" data-act="esborra">Esborra les meves valoracions</button></div>
</div>`;
};

P.test = ()=>{
  if(!S.test){
    let ids=[...S.temes].filter(x=>tema(x).actiu); if(!ids.length) ids=actius().map(t=>t.id);
    S.test={items:ids.map(id=>({tema:id,i:Math.floor(Math.random()*D.test[id].length),ans:null,done:false}))};
  }
  const it=S.test.items, done=it.filter(x=>x.done), ok=done.filter(x=>x.ans===D.test[x.tema][x.i].c).length;
  return `<div class="wrap narrow">
  <div class="pagehead"><div class="crumbs"><a href="#/">Inici</a></div><h1 tabindex="-1">Comprova què has entès</h1>
  <p>Una pregunta per tema, triada a l'atzar. Pots sortir quan vulguis. El resultat no afecta el teu balanç.</p></div>
  ${it.map((x,k)=>{const Q=D.test[x.tema][x.i];const nm=`t${k}`;
    return `<section class="tq" aria-labelledby="tq${k}"><span class="eyebrow">${esc(tema(x.tema).nom)} · ${k+1} de ${it.length}</span><h2 id="tq${k}">${esc(Q.q)}</h2>
    <fieldset><legend class="sr">Respostes</legend><div class="opts">
    ${[...Q.o,"No ho sé"].map((o,j)=>{const val=j<Q.o.length?j:-1;
      const doc=x.done&&val===Q.c, teva=x.done&&x.ans===val&&val!==Q.c&&val!==-1;
      const marca=doc?`<em class="badge">${x.ans===val?"La teva resposta · ":""}Resposta del document</em>`:teva?`<em class="badge">La teva resposta</em>`:"";
      return `<label class="opt ${doc?"ok":teva?"ko":""}"><input type="radio" name="${nm}" value="${val}" data-test="${k}" ${x.ans===val?"checked":""} ${x.done?"disabled":""}><span>${doc?ico.ok:teva?ico.ko:""}${esc(o)}${marca}</span></label>`}).join("")}
    </div></fieldset>
    ${x.done?`<div class="feedback ${x.ans===Q.c?"ok":x.ans===-1?"":"ko"}" role="status"><p style="margin:0 0 6px"><b>${x.ans===Q.c?"Coincideix amb el document.":x.ans===-1?"Cap problema: aquí tens la resposta.":"No coincideix amb el document."}</b> Segons el document, la resposta és: ${esc(Q.o[Q.c])}.</p><p style="margin:0 0 6px">${esc(Q.e)}</p><a href="#/q/${Q.ref}">Llegeix la pregunta ${Q.ref}</a></div>`
      :`<div class="actions" style="margin-top:14px"><button class="btn sec" data-act="test-check" data-k="${k}" ${x.ans===null?"disabled":""}>Comprova</button></div>`}
    </section>`}).join("")}
  ${done.length===it.length?`<div class="card" role="status"><h2>Has respost segons el document ${ok} de ${it.length}.</h2><p>Pots tornar a llegir els temes on has dubtat.</p><div class="actions"><button class="btn" data-act="test-new">Fes un altre test</button><a class="btn sec" href="#/temes">Torna als temes</a></div></div>`:""}
  ${note("D15","Preguntes sobre contingut verificable, amb «No ho sé», explicació i font. Sense cronòmetre, rànquing ni confeti. Verd i vermell només aquí, per a la correcció, i sempre amb icona i text: no depèn del color. Als escenaris no s'hi fan servir mai.")}
</div>`;
};

P.resum = ()=>{
  const c=calc();
  const temes=c.temes.length?c.temes.map(t=>t.nom):[...S.temes].map(x=>tema(x).nom);
  const vistes=[...S.vistes].map(preg);
  const rev=[...S.revisar].map(preg);
  const pend=D.preguntes.filter(q=>c.temes.some(t=>t.id===q.tema)).filter(q=>{const r=S.rat[q.id]||{};return !(typeof r.amb==="number"&&typeof r.sense==="number");});
  return `<div class="wrap narrow">
  <div class="pagehead"><div class="crumbs no-print"><a href="#/">Inici</a></div><h1 tabindex="-1">El teu recorregut</h1>
  <p>Resum personal generat en aquest dispositiu el ${new Date().toLocaleDateString("ca-AD",{day:"numeric",month:"long",year:"numeric"})}. Text de referència: Acord aprovat pel Consell de la UE, juliol de 2026 (traducció no oficial). Continguts revisats el ${esc(D.revisio)}.</p></div>
  <div class="card"><h2>Temes</h2>${temes.length?`<p style="margin:0">${temes.map(esc).join(" · ")}</p>`:`<p class="muted" style="margin:0">Encara no has triat cap tema.</p>`}</div>
  <div class="card"><h2>Preguntes que has consultat</h2>${vistes.length?`<ul class="list">${vistes.map(q=>`<li><a href="#/q/${q.id}">${esc(q.pregunta)}</a></li>`).join("")}</ul>`:`<p class="muted" style="margin:0">Cap encara.</p>`}
  ${rev.length?`<h2 style="margin-top:16px">Marcades per revisar</h2><ul class="list">${rev.map(q=>`<li><a href="#/q/${q.id}">${esc(q.pregunta)}</a></li>`).join("")}</ul>`:""}</div>
  ${c.complet?`<div class="card"><h2>El teu balanç</h2><label class="switch no-print" style="margin-bottom:12px"><input type="checkbox" data-act="inclou" ${S.inclouVal?"checked":""}><span class="trk"></span><span>Inclou les meves valoracions al document</span></label>
    ${S.inclouVal?(c.gen?`<p style="margin:0 0 4px"><b>Resultat general</b> · ${c.complet} de ${c.total} parelles valorades</p>${bars(c.gen.amb,c.gen.sense)}`:`<p>Resultat per tema al balanç. Falta indicar importàncies per al resultat general.</p>`)+`<p class="small muted" style="margin-top:12px">Aquest resultat només reflecteix les teves valoracions. No és una previsió ni una recomanació.</p>`:`<p class="muted" style="margin:0">Les valoracions no s'inclouran.</p>`}</div>`:""}
  ${pend.length&&c.temes.length?`<div class="card"><h2>Pendents o «Encara no ho sé»</h2><ul class="list">${pend.map(q=>`<li>${esc(q.pregunta)}</li>`).join("")}</ul></div>`:""}
  <div class="card"><h2>Fonts</h2><ul class="list"><li>${esc(D.docs.quadre.nom)}. ${esc(D.docs.quadre.autor)}.</li><li>${esc(D.docs.AM.nom)}. ${esc(D.docs.AM.versio)}.</li><li>${esc(D.docs.PA.nom)}. ${esc(D.docs.PA.versio)}.</li></ul></div>
  <div class="actions no-print"><button class="btn" data-act="print">Imprimeix o desa en PDF</button><a class="btn sec" href="#/temes">Continua explorant</a><button class="btn link" data-act="esborra">Esborra-ho tot</button></div>
  ${note("D17 · D18","La descàrrega es genera al dispositiu. La persona decideix si hi inclou les valoracions. Consta la data, la versió i el caràcter personal del balanç.")}
</div>`;
};

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
function reset(){searchTerm="";S.temes.clear();S.sit.clear();S.val=false;S.imp={};S.rat={};S.vistes.clear();S.revisar.clear();S.test=null;toast("Fet. No queda res guardat.");}

/* ---------- Router ---------- */
function route(){
  const h=(location.hash||"#/").slice(2).split("/");
  let html,cur;
  switch(h[0]){
    case "":cur="";html=P.inici();break;
    case "cerca":cur="";html=P.cerca();break;
    case "situacio":cur="temes";html=P.situacio();break;
    case "temes":cur="temes";html=P.temes(h[1]);break;
    case "tema":cur="temes";html=P.tema(h[1]);break;
    case "q":cur="temes";html=P.pregunta(h[1]);break;
    case "balanc":cur="balanc";html=P.balanc();break;
    case "test":cur="test";html=P.test();break;
    case "resum":cur="balanc";html=P.resum();break;
    case "no-canvia":cur="no-canvia";html=P.nocanvia();break;
    case "fonts":cur="fonts";html=P.fonts();break;
    case "privacitat":cur="";html=P.privacitat();break;
    case "glossari":cur="fonts";html=P.glossari();break;
    default:html=P.nf();
  }
  closeSrc();
  const mb=$(".menu-btn");if(mb){mb.setAttribute("aria-expanded","false");$("#menu").classList.remove("open");}
  $("#app").classList.toggle("home-main",h[0]==="");
  $("#app").innerHTML=html;
  document.title=(h[0]===""?"Amb o sense · L’Acord, a la teva vida":($("#app h1")?.textContent||"Amb o sense")+" · Amb o sense");
  $$(".top nav a").forEach(a=>{if(a.dataset.nav===cur)a.setAttribute("aria-current","page");else a.removeAttribute("aria-current");});
  if(h[0]==="tema"&&h[2]){const el=$("#q-"+h[2]);if(el){el.scrollIntoView();$("#h-"+h[2]).focus({preventScroll:true});return;}}
  window.scrollTo(0,0);
  const f=$("#app h1");if(f)f.focus({preventScroll:true});
}
function rerender(keepScroll=true){const y=window.scrollY;const a=document.activeElement;const key=a&&(a.dataset.rate||a.dataset.imp||a.dataset.test!==undefined)?(a.name+"|"+a.value):null;const focusId=a?.id;const focusAct=a?.dataset.act;route();if(keepScroll)window.scrollTo(0,y);if(key){const [n,v]=key.split("|");const el=$(`input[name="${n}"][value="${v}"]`);if(el)el.focus({preventScroll:true});}else if(focusId){document.getElementById(focusId)?.focus({preventScroll:true});}else if(focusAct==="inclou"){$('input[data-act="inclou"]')?.focus({preventScroll:true});}}

/* ---------- Esdeveniments ---------- */
document.addEventListener("submit",e=>{
  if(!e.target.matches(".search-form"))return;
  e.preventDefault();
  searchTerm=new FormData(e.target).get("question").trim().slice(0,120);
  if(location.hash==="#/cerca")route();else location.hash="#/cerca";
});
document.addEventListener("click",e=>{
  const src=e.target.closest("[data-src]");if(src){openSrc(src.dataset.src);return;}
  const a=e.target.closest("[data-act]");if(!a)return;
  const act=a.dataset.act, qid=a.dataset.q;
  if(act==="close-src")closeSrc();
  else if(act==="share"){const u=location.href.split("#")[0]+"#/q/"+qid;copy(u);}
  else if(act==="rev"){S.revisar.has(qid)?S.revisar.delete(qid):S.revisar.add(qid);rerender();}
  else if(act==="val-on"){S.val=true;rerender();const el=$("#q-"+qid+" .rate");if(el){el.scrollIntoView({block:"center"});const i=$("input",el);if(i)i.focus({preventScroll:true});}}
  else if(act==="val-on-nav"){S.val=true;}
  else if(act==="sit-go"){S.sit.forEach(i=>D.situacions[i].temes.forEach(t=>{if(tema(t).actiu)S.temes.add(t)}));location.hash="#/temes";}
  else if(act==="temes-go"){const f=[...S.temes][0];if(f)location.hash="#/tema/"+f;}
  else if(act==="test-check"){const k=+a.dataset.k;S.test.items[k].done=true;rerender();}
  else if(act==="test-new"){S.test=null;rerender(false);}
  else if(act==="esborra"){reset();rerender(false);}
  else if(act==="print"){window.print();}
  else if(act==="menu"){const open=a.getAttribute("aria-expanded")!=="true";a.setAttribute("aria-expanded",open);$("#menu").classList.toggle("open",open);}
  else if(act==="notes"){const on=document.body.classList.toggle("notes");a.setAttribute("aria-pressed",on);a.textContent=on?"Amaga les notes de disseny":"Mostra les notes de disseny";}
});
document.addEventListener("change",e=>{
  const t=e.target;
  if(t.dataset.sit!==undefined){const i=+t.dataset.sit;t.checked?S.sit.add(i):S.sit.delete(i);rerender();}
  else if(t.dataset.tema){t.checked?S.temes.add(t.dataset.tema):S.temes.delete(t.dataset.tema);rerender();$(`input[data-tema="${t.dataset.tema}"]`).focus({preventScroll:true});}
  else if(t.dataset.act==="val"){S.val=t.checked;rerender();$('input[data-act="val"]').focus({preventScroll:true});}
  else if(t.dataset.act==="inclou"){S.inclouVal=t.checked;rerender();}
  else if(t.dataset.imp){S.imp[t.dataset.imp]=+t.value;rerender();toast("Importància actualitzada");}
  else if(t.dataset.rate){const [q,side]=t.dataset.rate.split(":");S.rat[q]=S.rat[q]||{};S.rat[q][side]=t.value==="ns"?"ns":+t.value;rerender();}
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
