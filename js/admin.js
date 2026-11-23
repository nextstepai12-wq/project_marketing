/* admin */
let rows=[],view=[],dirty=false;
async function admin(){
if(!ready){app.innerHTML='<div class="page"><div class="panel"><div class="note">اربط Supabase أولًا (الرابط والمفتاح العام في أعلى الكود).</div></div></div>';return}
const {data:{session}}=await sb.auth.getSession();
if(!session){app.innerHTML=`<div class="page"><div class="panel" style="max-width:420px"><h2>دخول الإدارة</h2><form id="lg"><div class="fld"><label>البريد</label><input type="email" id="le" dir="ltr" required></div><div class="fld"><label>كلمة المرور</label><input type="password" id="lp" required></div><button class="btn" style="width:100%">دخول</button></form></div></div>`;
$('#lg').onsubmit=async e=>{e.preventDefault();const {error}=await sb.auth.signInWithPassword({email:$('#le').value,password:$('#lp').value});error?toast('بيانات الدخول غير صحيحة'):admin()};return}
app.innerHTML='<div class="page"><div class="wrap pl">جارٍ تحميل الطلبات…</div></div>';
const {data,error}=await sb.from('submissions').select('*').order('created_at',{ascending:false});
if(error){app.innerHTML='<div class="page"><div class="wrap"><div class="note">لا تملك صلاحية الإدارة. أضف حسابك إلى جدول admin_users.</div><button class="btn alt" id="lo">خروج</button></div></div>';$('#lo').onclick=async()=>{await sb.auth.signOut();admin()};return}
rows=data;
app.innerHTML=`<div class="page"><div class="wrap">
<div class="ah"><div><h2 style="margin:0">لوحة الإدارة</h2><small class="pl" dir="ltr">${esc(session.user.email)}</small></div>
<div class="ahb"><button class="btn alt sm" id="rf">تحديث</button><button class="btn alt sm" id="ex">تصدير Excel</button><button class="btn alt sm" id="lo">خروج</button></div></div>
<div class="stats" id="stats"></div>
<div class="bar"><input type="text" id="q" placeholder="ابحث بالاسم أو الرقم المرجعي"><select id="fs"><option value="">كل الحالات</option>${Object.entries(STATUS).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select><select id="ff"><option value="">كل المجالات</option>${FIELDS_OPT.map(o=>`<option>${o}</option>`).join('')}</select><select id="so"><option value="d">الأحدث أولًا</option><option value="o">الأقدم أولًا</option><option value="s">الأعلى تقييمًا</option></select></div>
<div class="tw"><table><thead><tr><th>الرقم</th><th>المشروع</th><th>المؤسس</th><th>المجال</th><th>التاريخ</th><th>الحالة</th><th>التقييم</th></tr></thead><tbody id="tb"></tbody></table></div><div class="pl" id="cnt" style="margin-top:10px"></div></div></div><dialog id="dg"></dialog>`;
const stats=()=>{const n=s=>rows.filter(r=>r.status==s).length,sc=rows.filter(r=>r.score>0),av=sc.length?Math.round(sc.reduce((a,r)=>a+r.score,0)/sc.length):'—',cur=$('#fs').value;
$('#stats').innerHTML=[['','الإجمالي',rows.length],['new','جديد',n('new')],['review','قيد المراجعة',n('review')],['approved','معتمد للنشر',n('approved')],['published','منشور',n('published')]].map(([k,l,v])=>`<button class="card sc2 ${cur==k?'on':''}" data-s="${k}"><small>${l}</small><b>${v}</b></button>`).join('')+`<div class="card"><small>متوسط التقييم</small><b>${av}</b></div>`};
const draw=()=>{const q=$('#q').value.trim().toLowerCase(),s=$('#fs').value,f=$('#ff').value,o=$('#so').value;
view=rows.filter(r=>(!s||r.status==s)&&(!f||r.field==f)&&(!q||(r.project_name+r.owner_name+r.ref).toLowerCase().includes(q)));
view.sort((a,b)=>o=='s'?b.score-a.score:o=='o'?new Date(a.created_at)-new Date(b.created_at):new Date(b.created_at)-new Date(a.created_at));
stats();$('#cnt').textContent=`عرض ${view.length} من ${rows.length} طلب`;
$('#tb').innerHTML=view.length?view.map((r,i)=>`<tr data-i="${i}"><td dir="ltr">${esc(r.ref)}</td><td><b>${esc(r.project_name)}</b></td><td>${esc(r.owner_name)}</td><td>${esc(r.field)}</td><td>${new Date(r.created_at).toLocaleDateString('ar')}</td><td><span class="st ${r.status}">${STATUS[r.status]||r.status}</span></td><td>${r.score?r.score+'/100':'—'}</td></tr>`).join(''):`<tr><td colspan="7" style="text-align:center;color:var(--mut);padding:36px">${rows.length?'لا توجد طلبات مطابقة للفلتر.':'لا توجد طلبات بعد. شارك رابط التقديم لتبدأ.'}</td></tr>`};
draw();['#q','#fs','#ff','#so'].forEach(s=>$(s).addEventListener('input',draw));
$('#stats').onclick=e=>{const b=e.target.closest('[data-s]');if(b){$('#fs').value=b.dataset.s;draw()}};
$('#tb').onclick=e=>{const tr=e.target.closest('tr[data-i]');if(tr)detail(+tr.dataset.i,draw)};
$('#lo').onclick=async()=>{await sb.auth.signOut();admin()};$('#rf').onclick=admin;
$('#ex').onclick=()=>{const h=['الرقم المرجعي','المشروع','المؤسس','البريد','الهاتف','المجال','الحالة','التقييم','نوع الفرصة','التاريخ'];
const c=v=>`"${String(v??'').replace(/"/g,'""')}"`;
const csv='\ufeff'+[h.map(c).join(','),...rows.map(r=>[r.ref,r.project_name,r.owner_name,r.email,r.details.phone,r.field,STATUS[r.status],r.score,OPPS[r.opportunity||''],r.created_at].map(c).join(','))].join('\n');
const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='nextstep-support.csv';a.click()}}
async function detail(i,redraw){const r=view[i],dg=$('#dg');dirty=false;
const urls=await Promise.all((r.files||[]).map(async f=>{const {data}=await sb.storage.from('submissions').createSignedUrl(f.path,3600);return data?`<a href="${data.signedUrl}" target="_blank" rel="noopener">${esc(f.name)}</a>`:''}));
const d=r.details||{},ph=(d.phone||'').replace(/\D/g,'');
const sec=STEPS.map(s=>{const l=s.f.filter(f=>!f.chk&&!f.file&&d[f.k]).map(f=>`<dt>${f.l}</dt><dd>${f.type=='url'&&/^https?:\/\//.test(d[f.k])?`<a href="${esc(d[f.k])}" target="_blank" rel="noopener" dir="ltr">${esc(d[f.k])}</a>`:esc(d[f.k])}</dd>`).join('');return l?`<h4>${s.t}</h4><dl class="qa">${l}</dl>`:''}).join('');
dg.innerHTML=`<div class="dh"><div><b>${esc(r.project_name)}</b> <span class="st ${r.status}">${STATUS[r.status]}</span><br><small dir="ltr" class="pl">${esc(r.ref)} · ${new Date(r.created_at).toLocaleString('ar')}</small></div>
<div class="ahb"><button class="btn alt sm" id="pv" ${i?'':'disabled'}>السابق</button><button class="btn alt sm" id="nx" ${i<view.length-1?'':'disabled'}>التالي</button><button class="btn alt sm" id="cl">إغلاق</button></div></div>
<div class="db"><div class="cts"><a class="btn alt sm" href="mailto:${esc(r.email)}">مراسلة بالبريد</a>${ph?`<a class="btn alt sm" href="https://wa.me/${ph}" target="_blank" rel="noopener">مراسلة واتساب</a>`:''}<span class="st ${d.c2?'approved':'declined'}">${d.c2?'وافق على النشر وإعادة النشر':'لم يوافق على النشر'}</span></div>
${sec}<h4>الملفات المرفقة</h4><p>${urls.join('، ')||'لا توجد ملفات'}</p>
<div class="rv"><h3 style="margin-top:0">التقييم</h3><div class="sc">${CRIT.map(([k,l,m])=>`<label>${l} <small>(حتى ${m})</small></label><input type="range" min="0" max="${m}" data-c="${k}" data-m="${m}" value="${r.scores?.[k]??0}"><output>0</output>`).join('')}</div>
<div class="tot">المجموع: <span id="tt">0</span>/100</div><div class="meter"><i id="mt"></i></div>
<div class="two"><div class="fld"><label>حالة الطلب</label><select id="s_st">${Object.entries(STATUS).map(([k,v])=>`<option value="${k}" ${r.status==k?'selected':''}>${v}</option>`).join('')}</select></div>
<div class="fld"><label>نوع الفرصة</label><select id="s_op">${Object.entries(OPPS).map(([k,v])=>`<option value="${k}" ${(r.opportunity||'')==k?'selected':''}>${v}</option>`).join('')}</select></div></div>
<div class="fld"><label>ملاحظات داخلية <small>(لا تظهر للمتقدم)</small></label><textarea id="s_nt">${esc(r.admin_notes)}</textarea></div>
<div class="fld"><label>سبب الرفض أو التأجيل <small>(إلزامي عند «غير مناسب حاليًا»)</small></label><input type="text" id="s_rj" value="${esc(r.reject_reason)}"></div>
<div class="two"><div class="fld"><label>قنوات النشر المناسبة</label><input type="text" id="s_ch" value="${esc(r.channels)}"></div><div class="fld"><label>رابط المنشور</label><input type="url" id="s_pu" dir="ltr" value="${esc(r.post_url)}"></div></div></div>
<h4>سجل التعديلات</h4><div id="lg2" class="pl">جارٍ التحميل…</div></div>
<div class="sbar"><button class="btn" id="sv">حفظ التغييرات</button><button class="btn alt" id="cd" type="button">نسخ البطاقة التعريفية</button></div>`;
const tot=()=>{let t=0;dg.querySelectorAll('[data-c]').forEach(x=>{t+=+x.value;x.nextElementSibling.textContent=x.value});$('#tt').textContent=t;$('#mt').style.width=t+'%';return t};tot();
dg.querySelectorAll('input,select,textarea').forEach(x=>x.addEventListener('input',()=>{dirty=true;if(x.dataset.c)tot()}));
const go=j=>{if(!dirty||confirm('لديك تعديلات غير محفوظة. متابعة بدون حفظ؟')){j==null?dg.close():detail(j,redraw)}};
$('#cl').onclick=()=>go(null);$('#pv').onclick=()=>go(i-1);$('#nx').onclick=()=>go(i+1);
$('#cd').onclick=()=>{if(!d.c2){toast('لا توجد موافقة نشر من صاحب المشروع');return}
navigator.clipboard?.writeText(`🚀 ${r.project_name}\nالمجال: ${r.field||''}\n\n${d.idea||''}\n${d.website?'\n🔗 '+d.website:''}\n\n#NextStepAI #مشروعك_يستحق_أن_يصل`).then(()=>toast('تم نسخ البطاقة'))};
sb.from('activity_log').select('*').eq('submission_id',r.id).order('created_at',{ascending:false}).limit(20).then(({data})=>{
$('#lg2').innerHTML=(data||[]).map(x=>`${new Date(x.created_at).toLocaleString('ar')} — ${esc(x.admin_email)}: من «${STATUS[x.changes?.from?.status]||'—'}» إلى «${STATUS[x.changes?.to?.status]||'—'}»، التقييم ${esc(x.changes?.to?.score)}`).join('<br>')||'لا توجد تعديلات بعد.'});
$('#sv').onclick=async()=>{const scores={};dg.querySelectorAll('[data-c]').forEach(x=>scores[x.dataset.c]=+x.value);
const up={scores,score:tot(),status:$('#s_st').value,opportunity:$('#s_op').value||null,admin_notes:$('#s_nt').value,reject_reason:$('#s_rj').value,channels:$('#s_ch').value,post_url:$('#s_pu').value,updated_at:new Date().toISOString()};
if(up.status=='declined'&&!up.reject_reason.trim()){toast('اكتب سبب الرفض أولًا');return}
if(up.status=='published'&&!up.post_url.trim()&&!confirm('لم تُدخل رابط المنشور. حفظ كمنشور؟'))return;
const {error}=await sb.from('submissions').update(up).eq('id',r.id);if(error){toast('تعذّر الحفظ');return}
const {data:{user}}=await sb.auth.getUser();
await sb.from('activity_log').insert({submission_id:r.id,admin_email:user?.email,action:'update',changes:{from:{status:r.status,score:r.score},to:{status:up.status,score:up.score}}});
Object.assign(r,up);dirty=false;redraw();dg.close();toast('تم الحفظ')};
if(!dg.open)dg.showModal()}


admin();
