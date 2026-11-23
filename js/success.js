function success(){const lastRef=sessionStorage.getItem('ns_ref')||'';app.innerHTML=`<div class="page"><div class="panel" style="text-align:center"><h2>وصل طلبك</h2><p>احتفظ بالرقم المرجعي، وسيراجع فريق NextStep AI مشروعك ويتواصل معك إن احتجنا معلومات إضافية.</p>
${lastRef?`<div class="refbox" id="rf">${lastRef}</div><button class="btn alt" id="cp">نسخ الرقم</button>`:''}<p><a class="btn" href="https://chat.whatsapp.com/FUKJyg2x6ToGWJq1hQ6iTa" target="_blank" rel="noopener">انضم لمجتمعنا على واتساب</a></p><p><a href="index.html">العودة إلى الرئيسية</a></p></div></div>`;
$('#cp')?.addEventListener('click',()=>navigator.clipboard?.writeText(lastRef).then(()=>toast('تم النسخ')))}


success();
