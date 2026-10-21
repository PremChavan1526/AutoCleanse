const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const btn=$('#clean'),cap=$('#cap');let on=false;
btn.onclick=()=>{on=!on;
$$('[data-b]').forEach(c=>{if(!c.dataset.a)c.dataset.a=c.textContent;c.textContent=on?c.dataset.b:c.dataset.a;c.classList.toggle('f',on)});
$('#dup').classList.toggle('gone',on);
btn.textContent=on?'Undo':'Clean it';btn.setAttribute('aria-pressed',on);
cap.textContent=on?'3 fixes, each logged with a reason: age filled with the median (27.5), “pune” matched to “Pune”, one duplicate removed.':'Raw upload: one missing age, inconsistent city spelling, one duplicate row.'};
const dev=$('#dev'),bl=$$('#dev .b'),ft=$$('.feat');
const set=n=>{bl.forEach(b=>b.classList.toggle('on',+b.dataset.n<=n));ft.forEach(f=>f.classList.toggle('act',+f.dataset.n===n))};
set(1);
if('IntersectionObserver' in window){const io=new IntersectionObserver(es=>es.forEach(e=>e.isIntersecting&&set(+e.target.dataset.n)),{rootMargin:'-45% 0px -45% 0px'});ft.forEach(f=>io.observe(f))}else bl.forEach(b=>b.classList.add('on'));
const OK={0:['Auto','Median','Mean'],1:['Auto','IQR','Z-score'],3:['Auto','Standard','Min-Max','Robust']},M=[['Missing values','Median','Mean','KNN'],['Outliers','IQR','Z-score','Isolation Forest'],['Encoding','One-hot','Ordinal','Target'],['Scaling','Standard','Min-Max','Robust'],['Class imbalance','SMOTE','Class weights','Off']];
$('#rows').innerHTML=M.map((r,i)=>`<div class="row"><b>${r[0]}</b><div class="seg" role="radiogroup" aria-label="${r[0]}">${['Auto',...r.slice(1)].map((o,j)=>`<label><input type="radio" name="m${i}" value="${o}"${j?'':' checked'}${(OK[i]||['Auto']).includes(o)?'':' disabled title="Runs in the full version"'}><span>${o}</span></label>`).join('')}</div></div>`).join('');
const esc=s=>String(s).replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';');
const MISS=/^\s*(na|n\/a|nan|null|none|-|—)?\s*$/i,isNum=v=>v.trim()!==''&&isFinite(+v);
function parse(t){const d=t.indexOf('\t')>-1&&t.indexOf(',')<0?'\t':',',R=[];let r=[],f='',q=false;for(let i=0;i<t.length;i++){const c=t[i];if(q){if(c=='"'){if(t[i+1]=='"'){f+='"';i++}else q=false}else f+=c}else if(c=='"')q=true;else if(c==d){r.push(f);f=''}else if(c=='\n'||c=='\r'){if(c=='\r'&&t[i+1]=='\n')i++;r.push(f);f='';R.push(r);r=[]}else f+=c}if(f!==''||r.length){r.push(f);R.push(r)}return R.filter(x=>x.some(v=>v.trim()!==''))}
const med=s=>{const m=s.length>>1;return s.length%2?s[m]:(s[m-1]+s[m])/2},qt=(s,p)=>{const i=(s.length-1)*p,l=Math.floor(i);return s[l]+(s[Math.min(l+1,s.length-1)]-s[l])*(i-l)};
function profile(H,R){const n=R.length,seen=new Set();let dup=0,miss=0,out=0,nc=0,bad=0;R.forEach(r=>{const k=JSON.stringify(r);seen.has(k)?dup++:seen.add(k)});
const cols=H.map((h,j)=>{const v=R.map(r=>r[j]),ok=v.filter(x=>!MISS.test(x)),m=v.length-ok.length,num=ok.length>0&&ok.every(isNum);let o=0,sp=0;
if(num){const s=ok.map(Number).sort((a,b)=>a-b),a=qt(s,.25),b=qt(s,.75),k=1.5*(b-a);o=s.filter(x=>x<a-k||x>b+k).length;nc+=s.length}else{sp=new Set(ok.map(x=>x.trim())).size-new Set(ok.map(x=>x.trim().toLowerCase())).size}
miss+=m;out+=o;if(sp>0)bad++;return{h,m,num,o}});
const c=1-miss/((n*H.length)||1),u=1-dup/(n||1),ou=1-out/(nc||1),co=1-bad/(H.length||1);
return{n,dup,miss,cols,score:Math.round(100*(.35*c+.15*u+.25*ou+.25*co))}}
function clean(H,R,S){const log=[];let rows=R.map(r=>r.map(x=>x.trim())),seen=new Set();const b0=rows.length;
rows=rows.filter(r=>{const k=JSON.stringify(r);return seen.has(k)?false:(seen.add(k),true)});
if(b0>rows.length)log.push(`Removed ${b0-rows.length} duplicate row(s), because repeated records over-weight the same example.`);
H.forEach((h,j)=>{const ok=rows.map(r=>r[j]).filter(x=>!MISS.test(x));if(!ok.length)return;
if(ok.every(isNum)){const s=ok.map(Number).sort((a,b)=>a-b),a=qt(s,.25),b=qt(s,.75),mu=s.reduce((x,y)=>x+y,0)/s.length,sd=Math.sqrt(s.reduce((x,y)=>x+(y-mu)**2,0)/s.length),z=S.out=='Z-score',k=1.5*(b-a),lo=z?mu-3*sd:a-k,hi=z?mu+3*sd:b+k,me=S.miss=='Mean',md=me?mu:med(s);let f=0,c=0;
rows.forEach(r=>{if(MISS.test(r[j])){r[j]=String(md);f++}else{const x=+r[j];if(x<lo||x>hi){r[j]=String(x<lo?lo:hi);c++}}});
if(f)log.push(`${h}: filled ${f} missing value(s) with the ${me?'mean':'median'} (${+md.toFixed(2)})${me?', as you chose. The mean can be pulled by extreme values.':', because the median isn’t pulled by extreme values.'}`);
if(c)log.push(`${h}: capped ${c} outlier(s) to ${+lo.toFixed(2)} to ${+hi.toFixed(2)} (${z?'3 standard deviations':'1.5 × IQR'}), so a few extreme values can’t dominate scaling.`)}
else{const cnt={},fr={};ok.forEach(x=>{const l=x.toLowerCase();(cnt[l]=cnt[l]||{})[x]=(cnt[l][x]||0)+1;fr[l]=(fr[l]||0)+1});
const best={};for(const l in cnt)best[l]=Object.entries(cnt[l]).sort((a,b)=>b[1]-a[1])[0][0];
const mode=best[Object.entries(fr).sort((a,b)=>b[1]-a[1])[0][0]];let f=0,u=0;
rows.forEach(r=>{if(MISS.test(r[j])){r[j]=mode;f++}else{const v=best[r[j].toLowerCase()];if(v!==r[j]){r[j]=v;u++}}});
if(u)log.push(`${h}: unified ${u} inconsistent spelling(s) to the most common form, so one category isn’t split in two.`);
if(f)log.push(`${h}: filled ${f} missing value(s) with the most common value (“${mode}”).`)}});
if(S.scale!='Auto')H.forEach((h,j)=>{const v=rows.map(r=>r[j]);if(!v.length||!v.every(isNum))return;const s=v.map(Number),so=[...s].sort((a,b)=>a-b),mu=s.reduce((x,y)=>x+y,0)/s.length,sd=Math.sqrt(s.reduce((x,y)=>x+(y-mu)**2,0)/s.length)||1,mn=so[0],mx=so[so.length-1],md=med(so),iq=(qt(so,.75)-qt(so,.25))||1,fn=S.scale=='Standard'?x=>(x-mu)/sd:S.scale=='Min-Max'?x=>(x-mn)/((mx-mn)||1):x=>(x-md)/iq;rows.forEach((r,i)=>{r[j]=String(+fn(s[i]).toFixed(4))});log.push(`${h}: scaled with ${S.scale} scaling, as you chose, so features share a comparable range.`)});
return{rows,log}}
const msg=t=>{$('#msg').textContent=t};
let last=null;const settings=()=>{const g=i=>($(`input[name=m${i}]:checked`)||{}).value||'Auto';return{miss:g(0),out:g(1),scale:g(3)}};
$('#rows').addEventListener('change',()=>{const n=$('#mnote');if(last){render(...last);n.textContent='Applied to '+last[2]+'. Scroll up to see the result.'}else n.textContent='Load a file or the sample in the demo above to see this applied.'});
function render(H,R,name){const a=profile(H,R),{rows,log}=clean(H,R,settings()),b=profile(H,rows);
const bar=(l,s,c)=>`<div>${l} <b>${s}</b>/100<div class="bar"><i class="${c}" style="width:${s}%"></i></div></div>`,tb=(h,body)=>`<div class="sc2"><table><thead><tr>${h.map(x=>`<th>${esc(x)}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table></div>`;
const o=$('#out');o.hidden=false;
o.innerHTML=`<div class="chips"><span>${esc(name)}</span><span>${a.n} rows</span><span>${H.length} columns</span><span>${a.miss} missing cells</span><span>${a.dup} duplicate rows</span></div><div class="two">${bar('Readiness before',a.score,'o')}${bar('Readiness after',b.score,'')}</div><small>Quick estimate from completeness, uniqueness, outliers and spelling consistency.</small><h3>Columns</h3>${tb(['Column','Type','Missing','Outliers'],a.cols.map(c=>`<tr><td>${esc(c.h)}</td><td>${c.num?'Number':'Text'}</td><td>${c.m}</td><td>${c.num?c.o:'—'}</td></tr>`).join(''))}<h3>What changed, and why</h3>${log.length?`<ul>${log.map(l=>`<li>${esc(l)}</li>`).join('')}</ul>`:'<p>No changes needed. This file already looks ready.</p>'}<h3>Cleaned preview</h3>${tb(H,rows.slice(0,5).map(r=>`<tr>${r.map(x=>`<td>${esc(x)}</td>`).join('')}</tr>`).join(''))}<button class="btn" id="dl" type="button">Download cleaned CSV</button>`;
$('#dl').onclick=()=>{const csv=[H,...rows].map(r=>r.map(x=>/[",\n\r]/.test(x)?'"'+x.replace(/"/g,'""')+'"':x).join(',')).join('\n');try{const u=URL.createObjectURL(new Blob([csv],{type:'text/csv'})),l=document.createElement('a');l.href=u;l.download='cleaned_'+name;l.click();setTimeout(()=>URL.revokeObjectURL(u),1e3)}catch(e){msg('Download isn’t available in this view. It works on the hosted page.')}}}
function load(text,name){const T=parse(text);if(T.length<2){msg('That file needs a header row and at least one data row.');$('#out').hidden=true;return}const H=T[0].map(x=>x.trim()),R=T.slice(1,50001).map(r=>H.map((_,j)=>r[j]??''));msg(T.length>50001?'Large file: analysed the first 50,000 rows.':'');last=[H,R,name];render(H,R,name)}
function pick(f){if(!f)return;if(f.size>5e6){msg('That file is over 5 MB. Try a smaller one.');return}const fr=new FileReader();fr.onload=()=>load(String(fr.result),f.name);fr.onerror=()=>msg('Couldn’t read that file.');fr.readAsText(f)}
$('#file').onchange=e=>pick(e.target.files[0]);
const dz=$('#drop');['dragenter','dragover'].forEach(t=>dz.addEventListener(t,e=>{e.preventDefault();dz.classList.add('over')}));['dragleave','drop'].forEach(t=>dz.addEventListener(t,e=>{e.preventDefault();dz.classList.remove('over')}));dz.addEventListener('drop',e=>pick(e.dataTransfer.files[0]));
$('#sample').onclick=()=>load('name,age,city,income\nAsha,24,Pune,42000\nRavi,,pune,39000\nMeera,31,Pune,41000\nRavi,,pune,39000\nKiran,29,Mumbai,4200000\nDiya,35,Pune ,45000\nNeil,28,Mumbai,40000\nSana,,mumbai,43000','sample.csv');
const nv=$('#menu'),bg=$('#burger'),shut=()=>{nv.classList.remove('open');bg.setAttribute('aria-expanded',false)};
bg.onclick=()=>{bg.setAttribute('aria-expanded',nv.classList.toggle('open'))};
nv.addEventListener('click',e=>{if(e.target.tagName=='A')shut()});
addEventListener('keydown',e=>{if(e.key=='Escape'&&nv.classList.contains('open')){shut();bg.focus()}});
const root=document.documentElement,dm=matchMedia('(prefers-color-scheme: dark)');
try{const t=localStorage.getItem('ac-theme');if(t)root.dataset.theme=t}catch(e){}
$('#theme').onclick=()=>{const nx=(root.dataset.theme||(dm.matches?'dark':'light'))=='dark'?'light':'dark';root.dataset.theme=nx;try{localStorage.setItem('ac-theme',nx)}catch(e){}};
const lk=$$('#menu a');if('IntersectionObserver' in window){const so=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)lk.forEach(a=>a.getAttribute('href')=='#'+e.target.id?a.setAttribute('aria-current','true'):a.removeAttribute('aria-current'))}),{rootMargin:'-40% 0px -55% 0px'});lk.forEach(a=>{const s=$(a.getAttribute('href'));s&&so.observe(s)})}
