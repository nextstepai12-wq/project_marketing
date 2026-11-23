const ready=!CFG.url.startsWith('YOUR');
const sb=ready&&window.supabase?supabase.createClient(CFG.url,CFG.key):null;
const $=s=>document.querySelector(s),app=$('#app');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const toast=t=>{const e=$('#toast');e.textContent=t;e.style.display='block';setTimeout(()=>e.style.display='none',3200)};
const FIELDS_OPT=['مشروع رقمي / تقني','متجر إلكتروني','مشروع حرفي','مشروع إبداعي','خدمات','تعليم وتدريب','مبادرة مجتمعية','أخرى'];
const STEPS=[
{t:'المعلومات الأساسية',f:[
{k:'owner_name',l:'اسم صاحب المشروع',r:1},{k:'email',l:'البريد الإلكتروني',type:'email',r:1},
{k:'phone',l:'رقم التواصل / واتساب',type:'tel',r:1},{k:'location',l:'الدولة والمحافظة',r:1},
{k:'role',l:'صفتك في المشروع',sel:['مؤسس','شريك','ممثل المشروع'],r:1}]},
{t:'معلومات المشروع',f:[
{k:'project_name',l:'اسم المشروع',r:1},{k:'field',l:'مجال المشروع',sel:FIELDS_OPT,r:1},
{k:'stage',l:'مرحلة المشروع',sel:['فكرة','قيد التطوير','انطلق حديثًا','قائم ويعمل'],r:1},
{k:'founded',l:'متى بدأ المشروع؟',h:'اختياري'},{k:'team',l:'حجم الفريق',h:'اختياري'}]},
{t:'فكرة المشروع وقيمته',f:[
{k:'idea',l:'اشرح فكرة مشروعك',ta:1,r:1},{k:'problem',l:'ما المشكلة التي يحلّها؟',ta:1,r:1},
{k:'value',l:'ما الفائدة التي يقدمها للناس؟',ta:1,r:1},{k:'unique',l:'ما الذي يميّزه عن غيره؟',ta:1}]},
{t:'المنتجات والجمهور',f:[
{k:'products',l:'المنتجات أو الخدمات التي تقدمها',ta:1,r:1},{k:'audience',l:'من هو جمهورك المستهدف؟',ta:1,r:1},
{k:'revenue',l:'الإيرادات',h:'اختياري',ta:1},{k:'achievements',l:'الإنجازات حتى الآن',h:'اختياري',ta:1}]},
{t:'الروابط والملفات',f:[
{k:'website',l:'رابط الموقع أو المتجر',type:'url',h:'اختياري'},{k:'social',l:'روابط الصفحات الاجتماعية',h:'اختياري',ta:1},
{k:'files',l:'شعار المشروع وصوره وملفاته',file:1,h:'صور أو PDF، حتى 5MB للملف الواحد و5 ملفات'}]},
{t:'الدعم المطلوب والإقرار',f:[
{k:'support',l:'ما الدعم الذي تحتاجه منا؟',ta:1,r:1},
{k:'c1',l:'أقرّ بأن المعلومات صحيحة، وأن التسجيل لا يضمن القبول أو النشر.',chk:1,r:1},
{k:'c2',l:'أوافق صراحة على نشر بيانات المشروع وصوره وإعادة نشرها عبر صفحات NextStep AI والمشاريع الشريكة في حال اختياره.',chk:1,r:1}]}];
const ALL=Object.fromEntries(STEPS.flatMap(s=>s.f).map(f=>[f.k,f]));
const STATUS={new:'جديد',review:'قيد المراجعة',info:'يحتاج معلومات إضافية',accepted:'مقبول مبدئيًا',approved:'معتمد للنشر',published:'منشور',declined:'غير مناسب حاليًا'};
const OPPS={'':'— لم يُحدد —',awareness:'يستحق حملة تعريفية',marketing:'يستحق حملة تسويقية',develop:'يحتاج تطويرًا قبل الترويج',incubate:'فكرة واعدة تحتاج احتضانًا',community:'مبادرة مجتمعية تستحق الانتشار'};
const CRIT=[['clarity','وضوح فكرة المشروع',15],['value','القيمة والفائدة المقدمة',20],['quality','جودة المنتج أو الخدمة',15],['innovation','التميز والابتكار',15],['readiness','جاهزية المشروع وجديته',15],['audience','وضوح الجمهور المستهدف',10],['presentation','جودة العرض والبيانات',10]];
const WA='https://chat.whatsapp.com/FUKJyg2x6ToGWJq1hQ6iTa';
