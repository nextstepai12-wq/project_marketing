let draft=JSON.parse(localStorage.getItem('ns_draft')||'{}'),step=+(localStorage.getItem('ns_step')||0),files=[],sending=false,lastRef='';

function inp(f){const v=draft[f.k]??'',a=`data-k="${f.k}" id="f_${f.k}"`;
if(f.chk)return `<div class="chk"><input type="checkbox" ${a} ${v?'checked':''}><label for="f_${f.k}" style="font-weight:400">${f.l}</label></div>`;
let h=`<label for="f_${f.k}">${f.l} ${f.h?`<small>(${f.h})</small>`:''}</label>`;
if(f.sel)h+=`<select ${a}><option value="">اختر…</option>${f.sel.map(o=>`<option ${v===o?'selected':''}>${o}</option>`).join('')}</select>`;
else if(f.ta)h+=`<textarea ${a}>${esc(v)}</textarea>`;
else if(f.file)h+=`<input type="file" id="f_files" multiple accept=".png,.jpg,.jpeg,.webp,.pdf"><div id="fl" class="pl"></div>`;
else h+=`<input type="${f.type||'text'}" ${a} value="${esc(v)}" ${f.type=='email'||f.type=='url'?'dir="ltr"':''}>`;
return h}
function apply(){const s=STEPS[step];
app.innerHTML=`<div class="page"><div class="panel"><div class="prog">${STEPS.map((_,i)=>`<i class="${i<=step?'on':''}" style="height:${40+i*12}%"></i>`).join('')}</div>
<div class="pl">المرحلة ${step+1} من ${STEPS.length}</div><h2>${s.t}</h2>
${ready?'':'<div class="note">قاعدة البيانات غير مربوطة بعد. أضف رابط Supabase والمفتاح العام في أعلى الكود قبل استقبال الطلبات.</div>'}
<form id="fm" novalidate><input class="hp" name="website2" tabindex="-1" autocomplete="off" aria-hidden="true">
${s.f.map(f=>`<div class="fld" data-f="${f.k}">${inp(f)}<div class="msg"></div></div>`).join('')}
<div class="nav2"><button type="button" class="btn alt" id="prev" ${step?'':'disabled'}>السابق</button>
<button type="submit" class="btn" id="next">${step==STEPS.length-1?'إرسال الطلب':'التالي'}</button></div></form></div></div>`;
const fm=$('#fm');
fm.addEventListener('input',e=>{const k=e.target.dataset.k;if(!k)return;draft[k]=e.target.type=='checkbox'?e.target.checked:e.target.value;localStorage.setItem('ns_draft',JSON.stringify(draft))});
const fi=$('#f_files');if(fi){const sh=()=>$('#fl').textContent=files.map(f=>f.name).join('، ');sh();
fi.addEventListener('change',()=>{const ok=['image/png','image/jpeg','image/webp','application/pdf'];const sel=[...fi.files];
if(sel.length>5||sel.some(f=>f.size>5242880||!ok.includes(f.type))){toast('الحد 5 ملفات، 5MB للملف، صور أو PDF فقط');fi.value='';files=[]}else files=sel;sh()})}
$('#prev').onclick=()=>{step--;localStorage.setItem('ns_step',step);apply();scrollTo(0,0)};
fm.onsubmit=async e=>{e.preventDefault();if(!validate(s))return;
if(step<STEPS.length-1){step++;localStorage.setItem('ns_step',step);apply();scrollTo(0,0)}else submit(fm.website2.value)}}
function validate(s){let ok=true;s.f.forEach(f=>{const box=$(`[data-f="${f.k}"]`),v=draft[f.k];let m='';
if(f.r&&!v)m=f.chk?'هذا الإقرار مطلوب':'هذا الحقل مطلوب';
else if(v&&f.type=='email'&&!/^\S+@\S+\.\S+$/.test(v))m='صيغة البريد غير صحيحة';
else if(v&&f.type=='tel'&&v.replace(/\D/g,'').length<7)m='رقم الهاتف غير صحيح';
else if(v&&f.type=='url'&&!/^https?:\/\//.test(v))m='ابدأ الرابط بـ https://';
box.classList.toggle('bad',!!m);box.querySelector('.msg').textContent=m;if(m)ok=false});
if(!ok)$('.bad')?.scrollIntoView({block:'center'});return ok}
async function submit(hp){if(sending)return;
if(hp){location.href='success.html';return}
if(!ready){toast('اربط قاعدة البيانات أولًا');return}
sending=true;const b=$('#next');b.disabled=true;b.textContent='جارٍ الإرسال…';
const ref='NS-'+new Date().getFullYear()+'-'+Math.random().toString(36).slice(2,8).toUpperCase();
try{const up=[];for(let i=0;i<files.length;i++){const f=files[i],ext=f.name.split('.').pop().toLowerCase().replace(/[^a-z0-9]/g,''),p=`${ref}/${i+1}.${ext}`;
const {error}=await sb.storage.from('submissions').upload(p,f,{contentType:f.type});if(error)throw error;up.push({path:p,name:f.name})}
const d={...draft};delete d.files;
const {error}=await sb.from('submissions').insert({ref,project_name:d.project_name,owner_name:d.owner_name,email:d.email.trim().toLowerCase(),field:d.field,details:d,files:up});
if(error)throw error;
localStorage.removeItem('ns_draft');localStorage.removeItem('ns_step');draft={};step=0;files=[];sessionStorage.setItem('ns_ref',ref);location.href='success.html'}
catch(err){toast(err.code=='23505'?'تم تقديم هذا المشروع من قبل بنفس البريد':'تعذّر الإرسال، تحقق من الاتصال وحاول مجددًا');b.disabled=false;b.textContent='إرسال الطلب'}
sending=false}

apply();
