import{r as s}from"./vendor-react-D4yGots9.js";const j="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",q="llama-3.3-70b-versatile",Q="https://api.groq.com/openai/v1/chat/completions",F=20,G=4e3,X=1500,V=.3,W=!0;async function Z(t){var n,a,r;console.log("[AI] PROMPT →",JSON.stringify(t,null,2));const e=await fetch(Q,{method:"POST",headers:{Authorization:`Bearer ${j}`,"Content-Type":"application/json"},body:JSON.stringify({model:q,messages:t,temperature:V,max_tokens:X,response_format:{type:"json_object"}})});if(!e.ok)throw e.status===429?new Error("RATE_LIMIT"):e.status===401?new Error("AUTH_ERROR"):new Error(`GROQ_ERROR_${e.status}`);const l=(r=(a=(n=(await e.json()).choices)==null?void 0:n[0])==null?void 0:a.message)==null?void 0:r.content;if(!l)throw new Error("EMPTY_RESPONSE");try{const f=JSON.parse(l);return console.log("[AI] RESPONSE ←",f),f}catch{return{answer:l,sources:[],relevant:!0,actions:[]}}}let ee=null;function M(t,e,o=5){if(!t||!e.trim())return[];const l=t.search(e,{limit:o*2,boost:{n:5,a:3,sec:2},fuzzy:.2,prefix:!0}),n=new Map,a=[];for(const r of l){const f=r,p=`${f.s||r.s}:${f.sec||""}`;if(!n.has(p)&&(n.set(p,!0),a.push({...f,score:r.score}),a.length>=o))break}return a}function te(){return ee!==null}const ae={ا:"a",أ:"a",إ:"a",آ:"a",ب:"b",ت:"t",ث:"s",ج:"c",ح:"h",خ:"h",د:"d",ذ:"z",ر:"r",ز:"z",س:"s",ش:"s",ص:"s",ض:"d",ط:"t",ظ:"z",ع:"a",غ:"g",ف:"f",ق:"k",ك:"k",ل:"l",م:"m",ن:"n",ه:"h",و:"v",ي:"y",ى:"a",ة:"e",ئ:"i",ؤ:"u"};function L(t){return t.replace(/[\u0600-\u06FF]/g,e=>ae[e]||"")}const N={tr:`Sen islamicatlas.org'un AI asistanısın. İslam tarihi, âlimler, hanedanlar, savaşlar ve coğrafya hakkında SADECE verilen bağlam bilgilerine dayanarak DETAYLI cevap verirsin.

KURALLAR:
1. SADECE <context> içindeki bilgilere dayanarak cevap ver
2. Bağlamda olmayan bilgiyi UYDURMA — "Bu bilgi veritabanımda yok" de
3. DETAYLI cevap ver: kişinin hayatı, eserleri, etkileri, önemli olaylar dahil et. En az 4-5 cümle yaz.
4. Önemli tarihleri (doğum-ölüm, hicrî/miladi), yerleri ve eserleri mutlaka belirt.
5. Eser adlarını orijinal Arapça/Osmanlıca formda ver (örn: "Kitâbü'l-Hayevân", "el-Muḳaddime", "İḥyâʾü ʿulûmi'd-dîn"). Transliterasyon kullan, Latin harfli çevirme yapma.
6. İslam tarihi dışındaki sorulara cevap verme
7. Cevabını Türkçe ver
8. Bağlamda birden fazla kişi/konu varsa hepsinden bahset, sadece ilkiyle yetinme.

CEVAP FORMATI (sadece JSON):
{
  "answer": "Detaylı cevap metni. Birden fazla paragraf olabilir. **Kalın** ve *italik* kullanabilirsin.",
  "sources": [{"name": "MAKALE ADI", "slug": "makale-slug"}],
  "relevant": true,
  "actions": [
    {"type": "flyTo", "lat": 39.77, "lon": 64.42, "zoom": 8, "label": "Buhara"}
  ]
}

sources alanında <context>'teki [slug:xxx] değerlerini aynen kullan.

Alakasız soru ise:
{"answer": "Bu soru atlas kapsamı dışında. İslam tarihi hakkında soru sorabilirsiniz.", "sources": [], "relevant": false, "actions": []}`,en:`You are the AI assistant of islamicatlas.org. Answer ONLY based on the provided context about Islamic history, scholars, dynasties, battles, and geography.

RULES:
1. Answer ONLY from <context> information
2. Do NOT invent — say "This information is not in my database"
3. Give DETAILED answers: include life, works, influence, key events. At least 4-5 sentences.
4. Always mention important dates (birth-death, hijri/CE), places, and works.
5. Give work titles in their original Arabic/Ottoman form (e.g. "Kitāb al-Ḥayawān", "al-Muqaddima", "Iḥyāʾ ʿulūm al-dīn"). Use transliteration, not translation.
6. Do not answer non-Islamic-history questions
7. Answer in English
8. If context contains multiple persons/topics, cover all of them, not just the first.

RESPONSE FORMAT (JSON only):
{
  "answer": "Detailed answer text. Can be multiple paragraphs. Use **bold** and *italic*.",
  "sources": [{"name": "ARTICLE NAME", "slug": "article-slug"}],
  "relevant": true,
  "actions": [
    {"type": "flyTo", "lat": 39.77, "lon": 64.42, "zoom": 8, "label": "Bukhara"}
  ]
}

Use the [slug:xxx] values from <context> in the sources field.

Irrelevant question:
{"answer": "This question is outside the atlas scope. You can ask about Islamic history.", "sources": [], "relevant": false, "actions": []}`,ar:`أنت المساعد الذكي لموقع islamicatlas.org. أجب بالتفصيل فقط بناءً على المعلومات المقدمة حول التاريخ الإسلامي.

القواعد:
1. أجب فقط من معلومات <context>
2. لا تختلق — قل "هذه المعلومة غير موجودة في قاعدة بياناتي"
3. أجب بالتفصيل: 4-5 جمل على الأقل مع التواريخ والأماكن والأعمال
4. اذكر أسماء الكتب بصيغتها العربية الأصلية
5. لا تجب على أسئلة خارج التاريخ الإسلامي
6. أجب بالعربية
7. إذا كان السياق يتضمن عدة أشخاص/مواضيع، اذكرهم جميعاً

صيغة الرد (JSON فقط):
{
  "answer": "نص الإجابة المفصلة",
  "sources": [{"name": "اسم المقال", "slug": "article-slug"}],
  "relevant": true,
  "actions": [{"type": "flyTo", "lat": 39.77, "lon": 64.42, "zoom": 8, "label": "بخارى"}]
}`},ne=[/bitcoin|crypto|nft/i,/hava durumu|weather/i,/futbol|basketball|nba|fifa/i,/programlama|python|javascript|coding/i,/yemek tarifi|recipe|cooking/i,/film|movie|netflix|spotify/i,/\b(selam|merhaba|hello|hi)\b$/i];function se(t){const e=t.trim();return e.length<2?!0:ne.some(o=>o.test(e))}function re(t){return Math.ceil(t.split(/\s+/).length/.75)}function oe(t){if(!t.length)return"";let e="",o=0;const l=G;for(let n=0;n<t.length;n++){const a=t[n],r=n+1,h=`
---
[${r<=2?"⭐ EN ALAKALI":r<=4?"📌 ALAKALI":"📎 EK"} #${r}] 📖 ${a.n} [slug:${a.s}]${a.sec?` — ${a.sec}`:""} ${a.d||""}
${a.t}
`,p=re(h);if(o+p>l){const E=l-o;if(E>100){const v=h.split(/\s+/).slice(0,Math.floor(E*.75));e+=v.join(" ")+"..."}break}e+=h,o+=p}return e}function ie(t,e,o="tr"){const l=N[o]||N.tr,n=oe(e),a=n?`<context>
${n}
</context>

Soru: ${t}`:`Soru: ${t}`;return[{role:"system",content:l},{role:"user",content:a}]}function le(t="tr"){const e={tr:"Bu soru atlas kapsamı dışında. İslam tarihi, âlimler, hanedanlar veya coğrafya hakkında soru sorabilirsiniz.",en:"This question is outside the atlas scope. You can ask about Islamic history, scholars, dynasties, or geography.",ar:"هذا السؤال خارج نطاق الأطلس. يمكنك السؤال عن التاريخ الإسلامي والعلماء والسلالات أو الجغرافيا."};return{answer:e[t]||e.tr,sources:[],relevant:!1,actions:[]}}function D(t,e="tr"){if(!t.length){const r={tr:"Arama sonucu bulunamadı. Farklı bir anahtar kelime deneyin.",en:"No search results found. Try different keywords.",ar:"لم يتم العثور على نتائج. حاول كلمات مفتاحية مختلفة."};return{answer:r[e]||r.tr,sources:[],relevant:!1,actions:[]}}const o={tr:`⚡ **AI yanıt limiti doldu.** İşte ilgili DİA maddeleri:

`,en:`⚡ **AI response limit reached.** Here are related DİA articles:

`,ar:`⚡ **تم الوصول إلى حد الاستجابة.** إليك المقالات ذات الصلة:

`},l={tr:`

_AI cevabı için yarın tekrar deneyin._`,en:`

_Try again tomorrow for AI-powered answers._`,ar:`

_حاول مرة أخرى غداً للحصول على إجابات AI._`};let n=o[e]||o.tr;const a=[];for(const r of t.slice(0,5)){const f=(r.t||"").slice(0,200).replace(/\n/g," ").trim();n+=`**${r.n}**${r.sec?` — ${r.sec}`:""}
${f}...

`,r.s&&!a.find(h=>h.slug===r.s)&&a.push({name:r.n,slug:r.s})}return n+=l[e]||l.tr,{answer:n,sources:a,relevant:!0,actions:[]}}function ce(t){const e=t.trim();return/[\u0600-\u06FF]{3,}/.test(e)?"ar":/^(who|what|where|when|how|tell|explain|describe|which|why|is|are|was|were|did|do|does)\b/i.test(e)||/\b(the|and|of|in|is|was|were|about|from)\b/i.test(e)?"en":"tr"}const Y="ia-ai-quota",C="ia-ai-history",ue=5,P=500*1024;function _(){return new Date().toISOString().slice(0,10)}function fe(){try{const t=JSON.parse(localStorage.getItem(Y)||"{}");if(t.date===_())return t.remaining}catch{}return F}function de(t){try{localStorage.setItem(Y,JSON.stringify({date:_(),remaining:t}))}catch{}}function z(){try{const t=localStorage.getItem(C);if(!t)return[];const e=JSON.parse(t);return Array.isArray(e)?e:[]}catch{return[]}}function me(t){try{const e=t.slice(-ue),o=JSON.stringify(e);if(o.length>P){let l=[...e];for(;l.length>1&&JSON.stringify(l).length>P;)l.shift();localStorage.setItem(C,JSON.stringify(l))}else localStorage.setItem(C,o)}catch{}}function he(t){return{id:Date.now().toString(36),date:_(),messages:t.map(e=>({role:e.role,text:e.text,sources:e.sources||[],time:e.time}))}}function ye({lang:t,onFlyTo:e,onHighlight:o,onFilter:l}){const[n,a]=s.useState([]),[r,f]=s.useState(!1),[h,p]=s.useState(te()),[E,v]=s.useState(!1),[y,R]=s.useState(fe),[I,T]=s.useState(z),[S,u]=s.useState(null),b=s.useRef(null);s.useEffect(()=>{de(y)},[y]);const x=s.useCallback(()=>{n.length!==0&&T(m=>{const c=S?m.map(k=>k.id===S?{...k,messages:n.map(d=>({role:d.role,text:d.text,sources:d.sources||[],time:d.time}))}:k):[...m,he(n)];return me(c),c})},[n,S]);s.useEffect(()=>{n.length>0&&x()},[n.length]),s.useEffect(()=>{const m=z();if(m.length>0){const c=m[m.length-1];a(c.messages),u(c.id),T(m)}},[]);const $=s.useCallback(async()=>{b.current},[]),K=s.useCallback(async m=>{var k;const c=m.trim();if(!(!c||r)){if(a(d=>[...d,{role:"user",text:c,time:Date.now()}]),se(c)){const d=le(t);a(w=>[...w,{role:"assistant",text:d.answer,sources:[],relevant:!1,time:Date.now()}]);return}f(!0);try{let d=[];if(b.current){const i=/[\u0600-\u06FF]/.test(c)?L(c)+" "+c:c;console.log("[AI] Search query:",i),d=M(b.current,i,8)}if(y<=0){const i=D(d,t);a(A=>[...A,{role:"assistant",text:i.answer,sources:i.sources,relevant:i.relevant,fallback:!0,time:Date.now()}]),f(!1);return}const w=ce(c),O=ie(c,d,w),g=await Z(O);if(W&&g.relevant&&((k=g.actions)!=null&&k.length))for(const i of g.actions)try{i.type==="flyTo"&&e&&e({lat:i.lat,lon:i.lon,zoom:i.zoom}),i.type==="highlight"&&o&&o(i.scholarIds),i.type==="filterByYear"&&l&&l(i)}catch(A){console.warn("[AI] Action failed:",A)}a(i=>[...i,{role:"assistant",text:g.answer||"",sources:g.sources||[],relevant:g.relevant!==!1,actions:g.actions||[],time:Date.now()}]),R(i=>Math.max(0,i-1))}catch(d){if(console.error("[AI] Error:",d),d.message==="RATE_LIMIT"){let i=[];if(b.current){const A=/[\u0600-\u06FF]/.test(c)?L(c)+" "+c:c;i=M(b.current,A,8)}if(i.length>0){const A=D(i,t);a(U=>[...U,{role:"assistant",text:A.answer,sources:A.sources,relevant:!0,fallback:!0,time:Date.now()}]),f(!1);return}}const w={RATE_LIMIT:{tr:"⚠️ API limit aşıldı. Biraz bekleyip tekrar deneyin.",en:"⚠️ API rate limit hit. Wait a moment and retry.",ar:"⚠️ تم تجاوز حد API. انتظر لحظة وأعد المحاولة."},AUTH_ERROR:{tr:"🔑 API anahtarı geçersiz. Lütfen yöneticiyle iletişime geçin.",en:"🔑 Invalid API key. Please contact the administrator.",ar:"🔑 مفتاح API غير صالح."},default:{tr:"❌ Bir hata oluştu. Tekrar deneyin.",en:"❌ An error occurred. Please try again.",ar:"❌ حدث خطأ. حاول مرة أخرى."}},O=w[d.message]?d.message:"default",g=w[O][t]||w[O].tr;a(i=>[...i,{role:"assistant",text:g,error:!0,time:Date.now()}])}f(!1)}},[t,r,y,e,o,l]),B=s.useCallback(()=>{n.length>0&&x(),a([]),u(null)},[n,x]),J=s.useCallback(()=>{a([]),u(null)},[]),H=s.useCallback(m=>{const c=I.find(k=>k.id===m);c&&(a(c.messages),u(c.id))},[I]);return{messages:n,loading:r,remaining:y,engineReady:h,engineError:E,chatHistory:I,sendMessage:K,clearChat:J,newChat:B,loadChat:H,initEngine:$}}function pe({lang:t,onFlyTo:e}){const[o,l]=s.useState(!1),[n,a]=s.useState(""),[r,f]=s.useState(!1),h=s.useRef(null),p=s.useRef(null),{messages:E,loading:v,sendMessage:y,newChat:R,loadChat:I,initEngine:T}=ye({lang:t,onFlyTo:e});s.useEffect(()=>{o&&(T(),setTimeout(()=>{var u;return(u=p.current)==null?void 0:u.focus()},300))},[o,T]),s.useEffect(()=>{var u;(u=h.current)==null||u.scrollIntoView({behavior:"smooth"})},[E,v]);const S=s.useCallback(()=>{!n.trim()||v||(y(n.trim()),a(""))},[n,v,y]);return s.useCallback(u=>{u.key==="Enter"&&!u.shiftKey&&(u.preventDefault(),S())},[S]),s.useCallback(u=>{y(u)},[y]),s.useCallback(()=>{R(),f(!1)},[R]),s.useCallback(u=>{I(u),f(!1)},[I]),s.useEffect(()=>{const u=b=>{b.key==="Escape"&&l(!1)};return o&&window.addEventListener("keydown",u),()=>window.removeEventListener("keydown",u)},[o]),null}export{pe as default};
