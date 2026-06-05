const fs = require('fs');

// ── Shared nav/footer/modal snippets ──────────────────────────────
const topbar = `<div class="topbar">
  <div class="topbar-left">
    <a href="index.html">☎ (+250) 788-591-503</a>
    <a href="mailto:info@excelacademy.rw">✉ info@excelacademy.rw</a>
    <a href="#">📧 Staff Email</a>
  </div>
  <div class="topbar-right">
    <button class="lang-btn">EN</button><button class="lang-btn">FR</button><button class="lang-btn">SW</button>
  </div>
</div>`;

const nav = `<nav>
  <a href="index.html" class="logo">
    <div class="logo-icon"><svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg></div>
    <div class="logo-text"><span class="name">Excel Academy</span><span class="tagline">Uburezi Buzira Inenge</span></div>
  </a>
  <div class="nav-links">
    <a href="index.html">Home</a>
    <div class="dropdown"><span>About Us ▾</span><div class="dropdown-menu">
      <a href="welcome.html">Welcome Messages</a><a href="about.html">Mission &amp; Vision</a>
      <a href="values.html">Goals &amp; Core Values</a><a href="documents.html">Key Documents</a>
    </div></div>
    <div class="dropdown"><span>Academics ▾</span><div class="dropdown-menu">
      <a href="nursery.html">Nursery Section</a><a href="primary.html">Primary Section</a>
      <a href="secondary.html">Secondary Section</a><a href="cambridge.html">Cambridge Curriculum</a>
      <a href="calendar.html">Academic Calendar</a>
    </div></div>
    <div class="dropdown"><span>Online Services ▾</span><div class="dropdown-menu">
      <a href="#" onclick="openModal('student');return false;">E-learning Portal</a>
      <a href="#" onclick="openModal('student');return false;">Student MIS</a>
      <a href="#" onclick="openModal('parent');return false;">Parent Portal</a>
      <a href="#" onclick="openModal('teacher');return false;">Staff Portal</a>
      <a href="library.html">Digital Library</a>
    </div></div>
    <a href="events.html">Events</a>
    <a href="contact.html">Contact</a>
    <a href="#" class="nav-cta" onclick="openModal('student');return false;">Apply Now</a>
  </div>
</nav>`;

const footer = `<footer>
  <div class="footer-grid">
    <div class="footer-brand">
      <a href="index.html" class="logo" style="text-decoration:none;">
        <div class="logo-icon" style="width:40px;height:40px;"><svg viewBox="0 0 24 24" style="width:22px;height:22px;fill:var(--gold);"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg></div>
        <div class="logo-text"><span class="name" style="color:white;font-size:1rem;">Excel Academy</span><span class="tagline">Uburezi Buzira Inenge</span></div>
      </a>
      <p>Shaping the leaders of tomorrow through quality education, strong values, and excellence across our two campuses in Kigali, Rwanda.</p>
      <div class="social-links">
        <a class="social-link" href="#"><svg viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg></a>
        <a class="social-link" href="#"><svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/></svg></a>
        <a class="social-link" href="#"><svg viewBox="0 0 24 24"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.95C18.88 4 12 4 12 4s-6.88 0-8.59.47A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.95C5.12 20 12 20 12 20s6.88 0 8.59-.47a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/></svg></a>
      </div>
    </div>
    <div class="footer-col"><h4>Quick Links</h4><a href="index.html">Home</a><a href="about.html">About Us</a><a href="events.html">Events</a><a href="contact.html">Contact</a></div>
    <div class="footer-col"><h4>Academics</h4><a href="nursery.html">Nursery</a><a href="primary.html">Primary</a><a href="secondary.html">Secondary</a><a href="cambridge.html">Cambridge</a><a href="calendar.html">Calendar</a></div>
    <div class="footer-col"><h4>Portals</h4><a href="#" onclick="openModal('student');return false;">Student Login</a><a href="#" onclick="openModal('parent');return false;">Parent Login</a><a href="#" onclick="openModal('teacher');return false;">Staff Login</a><a href="library.html">Library</a></div>
  </div>
  <div class="footer-bottom"><span>© 2026 Excel Academy. All rights reserved.</span><span>Designed by <a href="#" style="color:var(--gold);text-decoration:none;">Your Tech Team</a></span></div>
</footer>`;

const modal = `<div class="modal-overlay" id="loginModal">
  <div class="modal">
    <div class="modal-header"><h3 id="modalTitle">Student Portal</h3><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div class="modal-body">
      <div class="modal-role">
        <button class="role-tab active" onclick="switchRole('student',this)">Student</button>
        <button class="role-tab" onclick="switchRole('parent',this)">Parent</button>
        <button class="role-tab" onclick="switchRole('teacher',this)">Staff</button>
      </div>
      <div class="form-group"><label id="idLabel">Student ID</label><input type="text" placeholder="e.g. STU-2026-001"></div>
      <div class="form-group"><label>Password</label><input type="password" placeholder="Enter your password"></div>
      <button class="modal-submit">Sign In to Portal →</button>
      <div class="modal-links"><a href="#">Forgot password?</a> &nbsp;|&nbsp; <a href="#">Need help?</a></div>
    </div>
  </div>
</div>
<script>
  const roles={student:{title:'Student Portal',label:'Student ID / Registration No.'},parent:{title:'Parent Portal',label:'Parent ID / Phone Number'},teacher:{title:'Staff Portal',label:'Staff ID / Employee No.'}};
  function openModal(r){document.getElementById('loginModal').classList.add('open');setRole(r);document.querySelectorAll('.role-tab').forEach((t,i)=>t.classList.toggle('active',['student','parent','teacher'][i]===r));}
  function closeModal(){document.getElementById('loginModal').classList.remove('open');}
  function setRole(r){document.getElementById('modalTitle').textContent=roles[r].title;document.getElementById('idLabel').textContent=roles[r].label;}
  function switchRole(r,b){setRole(r);document.querySelectorAll('.role-tab').forEach(t=>t.classList.remove('active'));b.classList.add('active');}
  document.getElementById('loginModal').addEventListener('click',function(e){if(e.target===this)closeModal();});
<\/script>`;

const css = `<style>
:root{--navy:#0a1628;--gold:#c9973a;--gold-light:#e8b95a;--cream:#faf7f2;--warm-white:#fff9f0;--slate:#3a4a5c;--muted:#8a9ab0;--green:#1a6b4a;--red:#b03a2e;}
*{margin:0;padding:0;box-sizing:border-box;}html{scroll-behavior:smooth;}
body{font-family:'DM Sans',sans-serif;background:var(--cream);color:var(--navy);overflow-x:hidden;}
.topbar{background:var(--navy);color:var(--muted);font-size:.78rem;padding:8px 40px;display:flex;justify-content:space-between;align-items:center;}
.topbar a{color:var(--muted);text-decoration:none;transition:color .2s;}.topbar a:hover{color:var(--gold);}
.topbar-left{display:flex;gap:24px;}.topbar-right{display:flex;gap:16px;}
.lang-btn{background:none;border:1px solid #2a3a50;color:var(--muted);padding:2px 10px;border-radius:3px;cursor:pointer;font-size:.75rem;font-family:'DM Mono',monospace;transition:all .2s;}
.lang-btn:hover{border-color:var(--gold);color:var(--gold);}
nav{background:white;padding:0 40px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #e8e0d4;position:sticky;top:0;z-index:100;box-shadow:0 2px 20px rgba(10,22,40,.06);}
.logo{display:flex;align-items:center;gap:14px;padding:14px 0;text-decoration:none;}
.logo-icon{width:48px;height:48px;background:var(--navy);border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.logo-icon svg{width:28px;height:28px;fill:var(--gold);}
.logo-text .name{font-family:'Cormorant Garamond',serif;font-size:1.3rem;font-weight:700;color:var(--navy);display:block;}
.logo-text .tagline{font-size:.65rem;color:var(--gold);text-transform:uppercase;letter-spacing:.12em;font-family:'DM Mono',monospace;}
.nav-links{display:flex;align-items:center;gap:0;}
.nav-links a,.dropdown>span{display:block;padding:22px 16px;font-size:.82rem;font-weight:500;color:var(--slate);text-decoration:none;letter-spacing:.02em;cursor:pointer;transition:color .2s;position:relative;}
.nav-links a::after{content:'';position:absolute;bottom:0;left:16px;right:16px;height:2px;background:var(--gold);transform:scaleX(0);transition:transform .25s;}
.nav-links a:hover::after{transform:scaleX(1);}
.nav-links a:hover,.dropdown:hover>span{color:var(--navy);}
.dropdown{position:relative;}
.dropdown-menu{display:none;position:absolute;top:100%;left:0;background:white;min-width:220px;border:1px solid #e8e0d4;border-top:2px solid var(--gold);box-shadow:0 8px 32px rgba(10,22,40,.1);z-index:200;}
.dropdown:hover .dropdown-menu{display:block;}
.dropdown-menu a{padding:10px 20px;display:block;font-size:.8rem;color:var(--slate);border-bottom:1px solid #f0ebe4;transition:all .15s;}
.dropdown-menu a:hover{background:#faf7f2;color:var(--gold);padding-left:26px;}.dropdown-menu a::after{display:none;}
.nav-cta{background:var(--gold);color:white!important;padding:10px 22px!important;border-radius:4px;margin-left:16px;font-weight:600!important;letter-spacing:.04em;transition:background .2s!important;}
.nav-cta:hover{background:var(--navy)!important;}.nav-cta::after{display:none!important;}
.page-hero{background:var(--navy);padding:80px 40px 60px;position:relative;overflow:hidden;}
.page-hero::before{content:'';position:absolute;right:-100px;top:-100px;width:500px;height:500px;border-radius:50%;background:rgba(201,151,58,.06);}
.page-hero::after{content:'';position:absolute;left:-50px;bottom:-80px;width:300px;height:300px;border-radius:50%;background:rgba(255,255,255,.03);}
.breadcrumb{display:flex;align-items:center;gap:8px;font-size:.75rem;color:var(--muted);font-family:'DM Mono',monospace;letter-spacing:.05em;margin-bottom:20px;position:relative;z-index:1;}
.breadcrumb a{color:var(--gold);text-decoration:none;}
.page-hero h1{font-family:'Cormorant Garamond',serif;font-size:clamp(2.4rem,5vw,4rem);font-weight:700;color:white;line-height:1.1;margin-bottom:16px;position:relative;z-index:1;}
.page-hero h1 em{color:var(--gold-light);font-style:italic;}
.page-hero p{font-size:1rem;color:rgba(255,255,255,.6);max-width:560px;line-height:1.75;position:relative;z-index:1;}
.hero-divider{height:4px;background:linear-gradient(90deg,var(--gold),transparent);}
section{padding:80px 40px;}
.section-label{font-family:'DM Mono',monospace;font-size:.7rem;letter-spacing:.2em;text-transform:uppercase;color:var(--gold);margin-bottom:12px;}
h2.section-title{font-family:'Cormorant Garamond',serif;font-size:clamp(2rem,4vw,2.8rem);font-weight:700;color:var(--navy);line-height:1.1;margin-bottom:16px;}
.section-desc{font-size:.95rem;color:var(--slate);max-width:560px;line-height:1.75;margin-bottom:48px;}
.max-w{max-width:1100px;margin:0 auto;}
.center{text-align:center;}.center .section-desc{margin-left:auto;margin-right:auto;}
.card{background:white;border-radius:10px;border:1px solid #e8e0d4;padding:32px;transition:transform .2s,box-shadow .2s;}
.card:hover{transform:translateY(-4px);box-shadow:0 12px 40px rgba(10,22,40,.1);}
.card-gold{border-top:3px solid var(--gold);}
footer{background:#060e1c;color:rgba(255,255,255,.5);padding:48px 40px 28px;}
.footer-grid{display:grid;grid-template-columns:1.8fr 1fr 1fr 1fr;gap:48px;max-width:1100px;margin:0 auto 40px;}
.footer-brand p{font-size:.82rem;line-height:1.7;margin-top:14px;margin-bottom:20px;}
.social-links{display:flex;gap:10px;}
.social-link{width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;text-decoration:none;transition:all .2s;}
.social-link:hover{background:var(--gold);border-color:var(--gold);}
.social-link svg{width:16px;height:16px;fill:rgba(255,255,255,.6);}.social-link:hover svg{fill:white;}
.footer-col h4{color:white;font-size:.82rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase;margin-bottom:18px;}
.footer-col a{display:block;font-size:.8rem;color:rgba(255,255,255,.45);text-decoration:none;margin-bottom:10px;transition:color .15s;}
.footer-col a:hover{color:var(--gold);}
.footer-bottom{border-top:1px solid rgba(255,255,255,.06);padding-top:24px;max-width:1100px;margin:0 auto;display:flex;justify-content:space-between;align-items:center;font-size:.75rem;}
.modal-overlay{display:none;position:fixed;inset:0;background:rgba(10,22,40,.85);z-index:1000;align-items:center;justify-content:center;backdrop-filter:blur(4px);}
.modal-overlay.open{display:flex;}
.modal{background:white;border-radius:12px;overflow:hidden;width:440px;max-width:95vw;animation:modalIn .3s ease;}
@keyframes modalIn{from{opacity:0;transform:translateY(24px) scale(.97)}to{opacity:1;transform:none}}
.modal-header{background:var(--navy);padding:28px 32px;display:flex;align-items:center;justify-content:space-between;}
.modal-header h3{font-family:'Cormorant Garamond',serif;font-size:1.4rem;color:white;}
.modal-close{background:none;border:none;color:rgba(255,255,255,.5);cursor:pointer;font-size:1.4rem;}
.modal-body{padding:32px;}
.modal-role{display:flex;gap:8px;margin-bottom:24px;}
.role-tab{flex:1;padding:9px;border:1px solid #e0d8cc;border-radius:5px;background:none;cursor:pointer;font-size:.8rem;font-weight:500;color:var(--slate);transition:all .2s;}
.role-tab.active{background:var(--navy);color:white;border-color:var(--navy);}
.form-group{margin-bottom:18px;}
.form-group label{display:block;font-size:.78rem;font-weight:600;color:var(--slate);margin-bottom:6px;}
.form-group input{width:100%;padding:11px 14px;border:1px solid #e0d8cc;border-radius:5px;font-size:.88rem;font-family:'DM Sans',sans-serif;transition:border-color .2s;outline:none;}
.form-group input:focus{border-color:var(--gold);}
.modal-submit{width:100%;padding:13px;background:var(--gold);color:white;border:none;border-radius:5px;font-size:.9rem;font-weight:600;cursor:pointer;transition:background .2s;}
.modal-submit:hover{background:var(--navy);}
.modal-links{margin-top:14px;text-align:center;font-size:.78rem;color:var(--muted);}
.modal-links a{color:var(--gold);text-decoration:none;}
@media(max-width:900px){.footer-grid{grid-template-columns:1fr 1fr;}nav{padding:0 20px;}section{padding:60px 24px;}.page-hero{padding:60px 24px 40px;}}
@media(max-width:600px){.nav-links{display:none;}.footer-grid{grid-template-columns:1fr;}}
</style>`;

const head = (title) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} — Excel Academy</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
${css}
</head>
<body>
${topbar}
${nav}`;

const tail = `${footer}
${modal}
</body>
</html>`;

function page(title, breadcrumb, heroTitle, heroSub, content) {
  return head(title) + `
<div class="page-hero">
  <div class="breadcrumb"><a href="index.html">Home</a> / ${breadcrumb}</div>
  <h1>${heroTitle}</h1>
  <p>${heroSub}</p>
</div>
<div class="hero-divider"></div>
${content}
` + tail;
}

// ── PAGE CONTENTS ─────────────────────────────────────────────────

// WELCOME MESSAGES
const welcome = page('Welcome Messages', 'About Us / <span>Welcome Messages</span>',
'Welcome <em>Messages</em>', 'Inspiring words from our school leadership.',
`<section>
  <div class="max-w">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;">
      <div style="background:white;border-radius:10px;padding:40px;border-left:4px solid var(--gold);">
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px;">
          <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,var(--navy),var(--slate));display:flex;align-items:center;justify-content:center;font-size:1.5rem;color:white;font-weight:700;flex-shrink:0;">M</div>
          <div><div style="font-weight:700;font-size:1rem;">Mr. Marcel Nzeyimana</div><div style="font-size:.75rem;color:var(--gold);font-family:'DM Mono',monospace;">DIRECTOR / FOUNDER</div></div>
        </div>
        <div style="font-family:'Cormorant Garamond',serif;font-size:1.8rem;color:var(--gold);line-height:.5;margin-bottom:16px;">"</div>
        <p style="font-size:.9rem;color:var(--slate);line-height:1.85;font-style:italic;margin-bottom:16px;">Welcome to Excel Academy — a place where every child is known, valued, and inspired. Since our founding in 2010, we have remained committed to one truth: that education is the most powerful gift we can give a child.</p>
        <p style="font-size:.9rem;color:var(--slate);line-height:1.85;font-style:italic;margin-bottom:16px;">We do not simply teach subjects — we nurture future leaders, thinkers, and contributors to society. Our teachers are not just educators; they are mentors who invest in each learner's story.</p>
        <p style="font-size:.9rem;color:var(--slate);line-height:1.85;font-style:italic;">I invite every family to join our journey. Whether your child is in Nursery or Cambridge, they will find at Excel Academy a second home built on love, discipline, and excellence.</p>
      </div>
      <div style="background:white;border-radius:10px;padding:40px;border-left:4px solid var(--navy);">
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px;">
          <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,var(--gold),#8a6020);display:flex;align-items:center;justify-content:center;font-size:1.5rem;color:white;font-weight:700;flex-shrink:0;">A</div>
          <div><div style="font-weight:700;font-size:1rem;">Mrs. Ange Uwimana</div><div style="font-size:.75rem;color:var(--gold);font-family:'DM Mono',monospace;">HEAD OF ACADEMICS</div></div>
        </div>
        <div style="font-family:'Cormorant Garamond',serif;font-size:1.8rem;color:var(--navy);line-height:.5;margin-bottom:16px;">"</div>
        <p style="font-size:.9rem;color:var(--slate);line-height:1.85;font-style:italic;margin-bottom:16px;">Academic excellence is not a destination — it is a culture we build every single day. At Excel Academy, our curriculum is designed to challenge, inspire, and equip students with the critical thinking skills they need for the 21st century.</p>
        <p style="font-size:.9rem;color:var(--slate);line-height:1.85;font-style:italic;margin-bottom:16px;">Our teachers undergo continuous professional development to ensure they deliver world-class instruction. We blend Rwanda's Competency-Based Curriculum with the internationally recognised Cambridge framework.</p>
        <p style="font-size:.9rem;color:var(--slate);line-height:1.85;font-style:italic;">To our students: come curious, leave extraordinary. That is our promise to you.</p>
      </div>
    </div>
  </div>
</section>`);

// VALUES
const values = page('Goals & Core Values', 'About Us / <span>Goals &amp; Core Values</span>',
'Our Goals &amp; <em>Core Values</em>', 'The principles that guide every decision we make.',
`<section>
  <div class="max-w">
    <div class="center" style="margin-bottom:48px;">
      <div class="section-label">What We Stand For</div>
      <h2 class="section-title">Our Core Values</h2>
      <p class="section-desc">These values are not words on a wall — they shape how we teach, how we lead, and how we treat every member of our school community.</p>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin-bottom:64px;">
      ${[
        ['🎯','Excellence','We pursue the highest standards in teaching, learning, and school life. Mediocrity is never an option.'],
        ['🤝','Integrity','We act honestly, transparently, and ethically in all we do — even when no one is watching.'],
        ['💛','Respect','Every student, teacher, and parent is treated with dignity. We celebrate our diversity.'],
        ['💡','Innovation','We embrace new ideas, technologies, and teaching methods to prepare students for tomorrow.'],
        ['🌍','Service','We exist to serve our students, families, and the wider community of Rwanda and beyond.'],
        ['🏆','Discipline','Success requires perseverance and hard work. We cultivate self-discipline and personal responsibility.'],
      ].map(([ico,t,d])=>`<div class="card card-gold" style="text-align:center;"><div style="font-size:2.5rem;margin-bottom:16px;">${ico}</div><h3 style="font-family:'Cormorant Garamond',serif;font-size:1.3rem;margin-bottom:10px;">${t}</h3><p style="font-size:.83rem;color:var(--slate);line-height:1.7;">${d}</p></div>`).join('')}
    </div>
    <div style="background:var(--navy);border-radius:12px;padding:48px;">
      <div class="center" style="margin-bottom:36px;"><div class="section-label" style="color:var(--gold-light);">Strategic Direction</div><h2 class="section-title" style="color:white;">Our Goals</h2></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
        ${[
          ['Academic Goals','Achieve a 100% pass rate in national and Cambridge examinations by 2028.','Rank among the top 5 schools in Rwanda by academic performance.','Expand our Cambridge program to include more A-Level subjects.'],
          ['Infrastructure Goals','Build a fully equipped science and technology lab on both campuses.','Develop a comprehensive digital library accessible to all students.','Construct a multi-purpose sports and arts facility.'],
          ['Community Goals','Establish a scholarship fund for 50 deserving students annually.','Partner with universities for early admission programs.','Launch a parent leadership council across both campuses.'],
          ['Technology Goals','Achieve 100% digital classroom integration by 2027.','Launch a mobile app for the school management system.','Train all teaching staff in ICT-enhanced instruction.'],
        ].map(([t,...items])=>`<div style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:24px;"><h4 style="color:var(--gold);font-size:.9rem;font-weight:600;margin-bottom:14px;">${t}</h4><ul style="list-style:none;">${items.map(i=>`<li style="font-size:.82rem;color:rgba(255,255,255,.65);padding:5px 0;border-bottom:1px solid rgba(255,255,255,.07);display:flex;gap:8px;align-items:flex-start;"><span style="color:var(--gold);flex-shrink:0;">→</span>${i}</li>`).join('')}</ul></div>`).join('')}
      </div>
    </div>
  </div>
</section>`);

// DOCUMENTS
const documents = page('Key Documents', 'About Us / <span>Key Documents</span>',
'Key <em>Documents</em>', 'Download official school documents, policies, and forms.',
`<section>
  <div class="max-w">
    <div class="center" style="margin-bottom:48px;"><div class="section-label">Downloads</div><h2 class="section-title">Official Documents</h2><p class="section-desc">Access all important school documents. For physical copies, visit our administration office.</p></div>
    ${[
      ['📅 Academic Calendar & Policies','', [
        ['Academic Calendar 2025–2026','PDF, 1.2MB'],['School Prospectus 2026','PDF, 3.8MB'],
        ['Student Code of Conduct','PDF, 0.9MB'],['Examination Regulations','PDF, 0.7MB'],
      ]],
      ['📝 Admissions','', [
        ['Admission Requirements & Criteria','PDF, 0.5MB'],['Application Form 2026','PDF, 0.8MB'],
        ['Age Requirements by Section','PDF, 0.3MB'],['Scholarship Application Form','PDF, 0.6MB'],
      ]],
      ['💰 Fees & Finance','', [
        ['Fee Structure 2025–2026','PDF, 0.4MB'],['Payment Schedule & Methods','PDF, 0.3MB'],
        ['Financial Aid Guidelines','PDF, 0.5MB'],['Bursary Application Form','PDF, 0.4MB'],
      ]],
      ['📋 Policies','', [
        ['Health & Safety Policy','PDF, 0.6MB'],['Anti-Bullying Policy','PDF, 0.5MB'],
        ['ICT Acceptable Use Policy','PDF, 0.4MB'],['Data Protection Policy','PDF, 0.7MB'],
      ]],
    ].map(([section,_,docs])=>`
      <div style="margin-bottom:32px;">
        <h3 style="font-family:'Cormorant Garamond',serif;font-size:1.3rem;margin-bottom:16px;padding-bottom:10px;border-bottom:2px solid var(--gold);">${section}</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          ${docs.map(([n,s])=>`<div style="display:flex;align-items:center;justify-content:space-between;background:white;border:1px solid #e8e0d4;border-radius:6px;padding:14px 18px;transition:all .2s;" onmouseover="this.style.borderColor='var(--gold)'" onmouseout="this.style.borderColor='#e8e0d4'">
            <div style="display:flex;align-items:center;gap:12px;">
              <svg viewBox="0 0 24 24" style="width:20px;height:20px;fill:var(--gold);flex-shrink:0;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6"/></svg>
              <span style="font-size:.83rem;font-weight:500;">${n}</span>
            </div>
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:.7rem;color:var(--muted);font-family:'DM Mono',monospace;">${s}</span>
              <a href="#" style="font-size:.72rem;background:var(--navy);color:white;padding:4px 10px;border-radius:3px;text-decoration:none;white-space:nowrap;">⬇ Download</a>
            </div>
          </div>`).join('')}
        </div>
      </div>`).join('')}
  </div>
</section>`);

// EVENTS PAGE
const events = page('Events & News', 'Events',
'School <em>Events & News</em>', 'Stay updated on what\'s happening at Excel Academy.',
`<section>
  <div class="max-w">
    <div style="display:flex;gap:10px;margin-bottom:32px;flex-wrap:wrap;">
      ${['All','Upcoming','Academic','Sports','Arts & Culture','Community'].map((f,i)=>`<button style="padding:8px 18px;border-radius:20px;border:1px solid ${i===0?'var(--navy)':'#e8e0d4'};background:${i===0?'var(--navy)':'white'};color:${i===0?'white':'var(--slate)'};font-size:.8rem;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s;">${f}</button>`).join('')}
    </div>
    <div style="display:grid;grid-template-columns:2fr 1fr;gap:32px;">
      <div>
        ${[
          ['Science Fair Exhibition','May 8, 2026','Kibagabaga Campus','09:00 – 16:00','Academic','Annual student science exhibition showcasing innovative projects across all secondary classes. Parents and community members are welcome to attend.'],
          ['Parent-Teacher Meeting','May 14, 2026','Both Campuses','08:00 – 12:00','Academic','Term 3 parent-teacher conferences. Please confirm your attendance slot with the class teacher.'],
          ['Culture Day Celebration','May 17, 2026','Gahanga Campus','All Day','Arts & Culture','A vibrant celebration of Rwandan culture featuring traditional music, dance, art, and food. Students perform prepared cultural presentations.'],
          ['Sports Day 2026','May 25, 2026','Kibagabaga Grounds','08:00 – 17:00','Sports','Annual inter-class athletics competition. Events include track, field, football, basketball, and volleyball. Trophies awarded to top classes.'],
          ['End of Term Exams','June 1–14, 2026','All Campuses','07:30 – 12:00','Academic','Term 3 final examinations for all classes. Timetable available from class teachers and the admin office.'],
          ['Graduation Ceremony','June 20, 2026','Kibagabaga Campus Hall','09:00 – 13:00','Academic','Graduation for Cambridge A-Level leavers and Secondary Stage 13 students. Dress code: formal.'],
        ].map(([t,d,l,time,tag,desc])=>`
          <div style="background:white;border-radius:10px;border:1px solid #e8e0d4;overflow:hidden;margin-bottom:20px;display:flex;transition:box-shadow .2s;" onmouseover="this.style.boxShadow='0 8px 32px rgba(10,22,40,.1)'" onmouseout="this.style.boxShadow='none'">
            <div style="background:var(--navy);min-width:90px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px 16px;">
              <div style="font-family:'Cormorant Garamond',serif;font-size:2rem;font-weight:700;color:var(--gold-light);line-height:1;">${d.split(' ')[1].replace(',','')}</div>
              <div style="font-size:.65rem;color:rgba(255,255,255,.6);font-family:'DM Mono',monospace;letter-spacing:.08em;">${d.split(' ')[0].toUpperCase()}</div>
            </div>
            <div style="padding:20px 24px;flex:1;">
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
                <span style="font-size:.68rem;background:rgba(201,151,58,.1);color:#8a6020;padding:3px 8px;border-radius:20px;font-family:'DM Mono',monospace;">${tag}</span>
                <span style="font-size:.72rem;color:var(--muted);">🕐 ${time}</span>
                <span style="font-size:.72rem;color:var(--muted);">📍 ${l}</span>
              </div>
              <h3 style="font-family:'Cormorant Garamond',serif;font-size:1.2rem;margin-bottom:8px;">${t}</h3>
              <p style="font-size:.82rem;color:var(--slate);line-height:1.65;">${desc}</p>
            </div>
          </div>`).join('')}
      </div>
      <div>
        <div class="card card-gold" style="margin-bottom:20px;">
          <h3 style="font-family:'Cormorant Garamond',serif;font-size:1.15rem;margin-bottom:16px;">📌 School Notices</h3>
          ${[
            ['Term 3 Starts','All students report January 20, 2026'],
            ['Fee Deadline','Term 3 fees due by February 15, 2026'],
            ['Cambridge Reg','IGCSE/A-Level registrations close March 1'],
            ['School Closed','Public holiday: Liberation Day July 4'],
          ].map(([t,d])=>`<div style="padding:10px 0;border-bottom:1px solid #f0ebe4;"><div style="font-weight:600;font-size:.83rem;margin-bottom:2px;">${t}</div><div style="font-size:.75rem;color:var(--muted);">${d}</div></div>`).join('')}
        </div>
        <div class="card card-gold">
          <h3 style="font-family:'Cormorant Garamond',serif;font-size:1.15rem;margin-bottom:16px;">🗓️ Term Dates 2026</h3>
          ${[['Term 1','Jan 20 – Apr 4, 2026'],['Term 2','Apr 28 – Jul 10, 2026'],['Term 3','Jul 28 – Oct 24, 2026']].map(([t,d])=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #f0ebe4;"><span style="font-size:.83rem;font-weight:600;">${t}</span><span style="font-size:.75rem;color:var(--muted);">${d}</span></div>`).join('')}
        </div>
      </div>
    </div>
  </div>
</section>`);

// CONTACT
const contact = page('Contact Us', 'Contact',
'Get In <em>Touch</em>', 'We\'re here to help. Reach our team at any of our campuses.',
`<section>
  <div class="max-w">
    <div style="display:grid;grid-template-columns:1fr 1.4fr;gap:64px;">
      <div>
        <div class="section-label">Contact Information</div>
        <h2 class="section-title">Two Campuses,<br>One Community</h2>
        ${[
          ['📍','Kibagabaga Campus','Gasabo District, Kimironko Sector<br>Kigali, Rwanda'],
          ['📍','Gahanga Campus','Kicukiro District, Gahanga Sector<br>Kigali, Rwanda'],
          ['☎','Phone','(+250) 788-591-503<br>(+250) 785-446-090'],
          ['✉','Email','info@excelacademy.rw<br>admissions@excelacademy.rw'],
          ['🕐','Office Hours','Mon–Fri: 7:00am – 5:00pm<br>Saturday: 8:00am – 12:00pm'],
        ].map(([ico,t,v])=>`<div style="display:flex;gap:16px;margin-bottom:24px;align-items:flex-start;">
          <div style="width:40px;height:40px;border-radius:50%;background:rgba(201,151,58,.1);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:1rem;">${ico}</div>
          <div><div style="font-size:.7rem;color:var(--muted);letter-spacing:.06em;text-transform:uppercase;margin-bottom:4px;">${t}</div><div style="font-size:.9rem;color:var(--navy);">${v}</div></div>
        </div>`).join('')}
      </div>
      <div>
        <div style="background:white;border-radius:12px;padding:36px;border:1px solid #e8e0d4;">
          <h3 style="font-family:'Cormorant Garamond',serif;font-size:1.4rem;margin-bottom:24px;">Send Us a Message</h3>
          <form onsubmit="return false;" style="display:flex;flex-direction:column;gap:16px;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
              <div><label style="font-size:.75rem;font-weight:600;color:var(--slate);display:block;margin-bottom:6px;">Full Name</label><input type="text" placeholder="Your name" style="width:100%;padding:11px 14px;border:1px solid #e0d8cc;border-radius:5px;font-size:.88rem;font-family:'DM Sans',sans-serif;outline:none;"></div>
              <div><label style="font-size:.75rem;font-weight:600;color:var(--slate);display:block;margin-bottom:6px;">Email Address</label><input type="email" placeholder="your@email.com" style="width:100%;padding:11px 14px;border:1px solid #e0d8cc;border-radius:5px;font-size:.88rem;font-family:'DM Sans',sans-serif;outline:none;"></div>
            </div>
            <div><label style="font-size:.75rem;font-weight:600;color:var(--slate);display:block;margin-bottom:6px;">Phone Number</label><input type="tel" placeholder="+250 ..." style="width:100%;padding:11px 14px;border:1px solid #e0d8cc;border-radius:5px;font-size:.88rem;font-family:'DM Sans',sans-serif;outline:none;"></div>
            <div><label style="font-size:.75rem;font-weight:600;color:var(--slate);display:block;margin-bottom:6px;">Enquiry Type</label><select style="width:100%;padding:11px 14px;border:1px solid #e0d8cc;border-radius:5px;font-size:.88rem;font-family:'DM Sans',sans-serif;outline:none;color:var(--slate);"><option>Admission Enquiry</option><option>Academic Information</option><option>Fee Structure</option><option>Online Portal Support</option><option>General Information</option></select></div>
            <div><label style="font-size:.75rem;font-weight:600;color:var(--slate);display:block;margin-bottom:6px;">Message</label><textarea rows="5" placeholder="How can we help you?" style="width:100%;padding:11px 14px;border:1px solid #e0d8cc;border-radius:5px;font-size:.88rem;font-family:'DM Sans',sans-serif;outline:none;resize:vertical;"></textarea></div>
            <button type="submit" style="background:var(--gold);color:white;border:none;padding:14px;border-radius:5px;font-size:.9rem;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:background .2s;" onmouseover="this.style.background='var(--navy)'" onmouseout="this.style.background='var(--gold)'">Send Message →</button>
          </form>
        </div>
      </div>
    </div>
  </div>
</section>`);

// ACADEMIC SECTION TEMPLATE
function academicPage(title, slug, color, ages, desc, highlights, subjects, activities) {
  return page(title, `Academics / <span>${title}</span>`,
  `${title} <em>Section</em>`, desc,
  `<section>
    <div class="max-w">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:60px;margin-bottom:64px;">
        <div>
          <div class="section-label">About This Section</div>
          <h2 class="section-title">Nurturing Every <em style="font-style:italic;color:var(--gold);">Learner</em></h2>
          <p style="font-size:.95rem;color:var(--slate);line-height:1.85;margin-bottom:20px;">${desc} Our dedicated team ensures that every child receives the individual attention and support they need to thrive.</p>
          <p style="font-size:.95rem;color:var(--slate);line-height:1.85;margin-bottom:32px;">At Excel Academy, learning goes beyond textbooks. We combine Rwanda's national curriculum with enriched activities, technology, and character development to produce well-rounded graduates.</p>
          <div style="display:flex;gap:12px;flex-wrap:wrap;">
            <div style="background:var(--navy);color:white;padding:10px 20px;border-radius:5px;font-size:.78rem;font-family:'DM Mono',monospace;">${ages}</div>
            <a href="#" onclick="openModal('student');return false;" style="background:var(--gold);color:white;padding:10px 20px;border-radius:5px;font-size:.78rem;font-weight:600;text-decoration:none;letter-spacing:.04em;">Apply Now →</a>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;align-content:start;">
          ${highlights.map(([ico,t,d])=>`<div class="card card-gold"><div style="font-size:1.6rem;margin-bottom:10px;">${ico}</div><div style="font-weight:700;font-size:.88rem;margin-bottom:4px;">${t}</div><div style="font-size:.78rem;color:var(--slate);">${d}</div></div>`).join('')}
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;">
        <div style="background:white;border-radius:10px;padding:32px;border:1px solid #e8e0d4;">
          <h3 style="font-family:'Cormorant Garamond',serif;font-size:1.3rem;margin-bottom:20px;">📚 Subjects Offered</h3>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
            ${subjects.map(s=>`<div style="padding:8px 12px;background:var(--cream);border-radius:5px;font-size:.82rem;color:var(--slate);display:flex;align-items:center;gap:6px;"><span style="color:var(--gold);">✓</span>${s}</div>`).join('')}
          </div>
        </div>
        <div style="background:var(--navy);border-radius:10px;padding:32px;">
          <h3 style="font-family:'Cormorant Garamond',serif;font-size:1.3rem;color:white;margin-bottom:20px;">🎭 Co-Curricular Activities</h3>
          <div style="display:flex;flex-direction:column;gap:10px;">
            ${activities.map(a=>`<div style="display:flex;align-items:center;gap:10px;padding:10px;background:rgba(255,255,255,.05);border-radius:6px;border:1px solid rgba(255,255,255,.08);"><span style="color:var(--gold);">→</span><span style="font-size:.83rem;color:rgba(255,255,255,.75);">${a}</span></div>`).join('')}
          </div>
        </div>
      </div>
    </div>
  </section>`);
}

const nursery = academicPage('Nursery','nursery','#1a4a6a','Ages 3–5 Years',
  'Our Nursery section provides a loving, stimulating environment where our youngest learners discover the joy of learning through play, creativity, and exploration.',
  [['🎨','Creative Play','Art, music, and play-based learning'],['📖','Early Literacy','Phonics and early reading skills'],['🔢','Numeracy','Fun with numbers and patterns'],['🌱','Life Skills','Social and emotional development']],
  ['English Language','Kinyarwanda','Mathematics','Environmental Studies','Music & Movement','Arts & Crafts','Physical Education','Social Skills'],
  ['Morning Circle & Calendar Time','Story Time & Read-Alouds','Outdoor Play & Nature Walks','Music & Dance Sessions','Art & Craft Projects','Show & Tell Activities','Drama & Role Play','Field Trips & Nature Discovery']
);

const primary = academicPage('Primary','primary','#1a6a3a','Stages 1–6 (Ages 6–12)',
  'Our Primary Section follows Rwanda\'s Competency-Based Curriculum, building strong academic foundations while developing critical thinking, creativity, and character.',
  [['📘','CBC Curriculum','Rwanda national competency-based curriculum'],['🔬','STEM Focus','Science, technology, engineering and math'],['🌐','Languages','English, Kinyarwanda and French'],['🏆','Academic Excellence','Regular assessments and recognition']],
  ['English Language','Kinyarwanda','French','Mathematics','Science & Technology','Social Studies','Religious Education','Physical Education','Creative Arts','ICT'],
  ['Science Club & Experiments','Reading Champions Programme','Maths Olympiad Preparation','Football, Basketball & Athletics','Drama & School Plays','Environmental Club','Debate & Public Speaking','Annual Cultural Exhibition']
);

const secondary = academicPage('Secondary','secondary','#6a3a1a','Stages 7–13 (Ages 13–19)',
  'Our Secondary Section prepares students for national examinations and beyond, combining rigorous academics with leadership development and university readiness programs.',
  [['🎓','University Prep','94% of graduates gain university entry'],['📊','Results','98% national exam pass rate'],['👩‍🏫','Expert Staff','PhD and Masters-level teachers'],['💻','Technology','Fully equipped computer labs']],
  ['Mathematics','English Language','Physics','Chemistry','Biology','Geography','History','Economics','Computer Science','Entrepreneurship','Physical Education','French/Kiswahili'],
  ['Young Scientists Programme','Model United Nations (MUN)','School Debate Championship','Football & Basketball Teams','Leadership & Prefect Body','Community Service Projects','University Visit Programme','Career Guidance & Counselling']
);

const cambridge = academicPage('Cambridge Curriculum','cambridge','#4a1a6a','IGCSE & A-Level',
  'Our Cambridge International programme offers globally recognised qualifications that open doors to leading universities worldwide. We are a registered Cambridge Assessment International Education centre.',
  [['🌍','Global Recognition','Accepted by 10,000+ universities worldwide'],['📜','Certified Centre','Registered Cambridge Assessment centre'],['📈','Top Results','Outstanding IGCSE & A-Level grades'],['🎓','University Links','Partnerships with international universities']],
  ['Mathematics','English Language & Literature','Physics','Chemistry','Biology','Economics','Business Studies','History','Geography','Computer Science','Art & Design','French'],
  ['Cambridge Study Skills Workshops','University Application Support','UCAS & International Admissions Help','Extended Essay & Research Projects','Science Laboratory Practice','Cambridge Model Parliament','Duke of Edinburgh Programme','International Exchange Partnerships']
);

// CALENDAR
const calendar = page('Academic Calendar', 'Academics / <span>Academic Calendar</span>',
'Academic <em>Calendar 2026</em>', 'Important dates, term schedules, and examination timetables.',
`<section>
  <div class="max-w">
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:24px;margin-bottom:48px;">
      ${[
        ['Term 1','Jan 20 – Apr 4, 2026','Opens Jan 20','Exams: Mar 23–Apr 4','Closes Apr 4'],
        ['Term 2','Apr 28 – Jul 10, 2026','Opens Apr 28','Exams: Jun 29–Jul 10','Closes Jul 10'],
        ['Term 3','Jul 28 – Oct 24, 2026','Opens Jul 28','Exams: Oct 13–Oct 24','Closes Oct 24'],
      ].map(([t,d,...items],i)=>`<div style="background:${i===1?'var(--gold)':'var(--navy)'};border-radius:10px;padding:32px;color:white;">
        <div style="font-family:'DM Mono',monospace;font-size:.7rem;letter-spacing:.15em;opacity:.6;margin-bottom:8px;">${d}</div>
        <h3 style="font-family:'Cormorant Garamond',serif;font-size:1.5rem;margin-bottom:20px;">${t}</h3>
        ${items.map(item=>`<div style="font-size:.82rem;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.15);opacity:.8;">${item}</div>`).join('')}
      </div>`).join('')}
    </div>
    <div style="background:white;border-radius:10px;border:1px solid #e8e0d4;overflow:hidden;margin-bottom:32px;">
      <div style="background:var(--navy);padding:20px 24px;"><h3 style="font-family:'Cormorant Garamond',serif;color:white;font-size:1.2rem;">Key Dates & Events 2026</h3></div>
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr style="background:#f8f4ee;"><th style="padding:12px 16px;text-align:left;font-size:.7rem;color:var(--muted);letter-spacing:.08em;font-family:'DM Mono',monospace;">DATE</th><th style="padding:12px 16px;text-align:left;font-size:.7rem;color:var(--muted);letter-spacing:.08em;font-family:'DM Mono',monospace;">EVENT</th><th style="padding:12px 16px;text-align:left;font-size:.7rem;color:var(--muted);letter-spacing:.08em;font-family:'DM Mono',monospace;">WHO</th><th style="padding:12px 16px;text-align:left;font-size:.7rem;color:var(--muted);letter-spacing:.08em;font-family:'DM Mono',monospace;">CATEGORY</th></tr></thead>
        <tbody>
          ${[
            ['Jan 20','School Opens — Term 1','All Students','Term Start'],
            ['Feb 15','Term 1 Fee Deadline','Parents','Finance'],
            ['Mar 1','Cambridge Registration Closes','Cambridge Students','Exams'],
            ['Mar 23 – Apr 4','Term 1 Examinations','All Students','Exams'],
            ['Apr 4','Term 1 Closes','All Students','Term End'],
            ['Apr 28','School Opens — Term 2','All Students','Term Start'],
            ['May 8','Science Fair Exhibition','All Students','Event'],
            ['May 14','Parent-Teacher Meeting','Parents & Teachers','Meeting'],
            ['May 17','Culture Day','All Students','Event'],
            ['May 25','Sports Day','All Students','Event'],
            ['Jun 20','Graduation Ceremony','Cambridge & S6','Event'],
            ['Jun 29 – Jul 10','Term 2 Examinations','All Students','Exams'],
            ['Jul 10','Term 2 Closes','All Students','Term End'],
            ['Jul 28','School Opens — Term 3','All Students','Term Start'],
            ['Oct 13 – Oct 24','Term 3 Final Examinations','All Students','Exams'],
            ['Oct 24','School Year Closes','All Students','Term End'],
          ].map(([d,e,w,c])=>`<tr style="border-bottom:1px solid #f0ebe4;">
            <td style="padding:12px 16px;font-size:.8rem;font-family:'DM Mono',monospace;color:var(--muted);">${d}</td>
            <td style="padding:12px 16px;font-size:.83rem;font-weight:500;">${e}</td>
            <td style="padding:12px 16px;font-size:.8rem;color:var(--slate);">${w}</td>
            <td style="padding:12px 16px;"><span style="font-size:.68rem;padding:3px 8px;border-radius:20px;background:${c==='Exams'?'rgba(176,58,46,.1)':c==='Finance'?'rgba(201,151,58,.1)':c.includes('Term')?'rgba(26,107,74,.1)':'rgba(10,22,40,.08)'};color:${c==='Exams'?'var(--red)':c==='Finance'?'#8a6020':c.includes('Term')?'var(--green)':'var(--navy)'};font-family:'DM Mono',monospace;">${c}</span></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>
</section>`);

// LIBRARY
const library = page('Digital Library', 'Online Services / <span>Digital Library</span>',
'Digital <em>Library</em>', 'Access thousands of books, journals, and learning resources online.',
`<section>
  <div class="max-w">
    <div style="background:var(--navy);border-radius:12px;padding:40px;margin-bottom:40px;display:flex;align-items:center;gap:32px;">
      <div style="flex:1;">
        <div class="section-label" style="color:var(--gold-light);">Library Access</div>
        <h2 style="font-family:'Cormorant Garamond',serif;font-size:2rem;color:white;margin-bottom:14px;">Access Our Library</h2>
        <p style="font-size:.9rem;color:rgba(255,255,255,.65);line-height:1.75;margin-bottom:24px;">Students and staff can access our digital library 24/7 using their school login credentials. Browse thousands of textbooks, past papers, and educational resources.</p>
        <button onclick="openModal('student')" style="background:var(--gold);color:white;border:none;padding:12px 28px;border-radius:5px;font-size:.88rem;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;">Login to Access Library →</button>
      </div>
      <div style="font-size:6rem;opacity:.15;flex-shrink:0;">📚</div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;">
      ${[
        ['📖','Textbooks & Study Guides','Over 2,000 digital textbooks covering all subjects from Nursery to Cambridge A-Level.'],
        ['📄','Past Exam Papers','Complete collections of national and Cambridge past papers with marking schemes.'],
        ['🎥','Video Lessons','Curated educational videos aligned to our curriculum for self-paced learning.'],
        ['📰','Academic Journals','Access to peer-reviewed journals and research publications for advanced students.'],
        ['📋','Lesson Resources','Teacher-created notes, worksheets, and revision materials for every class.'],
        ['🌐','Online Databases','Access to encyclopedia databases, world maps, atlases and reference materials.'],
      ].map(([ico,t,d])=>`<div class="card card-gold"><div style="font-size:2rem;margin-bottom:12px;">${ico}</div><h3 style="font-family:'Cormorant Garamond',serif;font-size:1.15rem;margin-bottom:8px;">${t}</h3><p style="font-size:.82rem;color:var(--slate);line-height:1.65;">${d}</p></div>`).join('')}
    </div>
  </div>
</section>`);

// BUILD ALL PAGES
const pages = {
  'welcome.html': welcome, 'values.html': values, 'documents.html': documents,
  'events.html': events, 'contact.html': contact,
  'nursery.html': nursery, 'primary.html': primary,
  'secondary.html': secondary, 'cambridge.html': cambridge,
  'calendar.html': calendar, 'library.html': library,
};

Object.entries(pages).forEach(([filename, content]) => {
  fs.writeFileSync(`/home/claude/school-pages/${filename}`, content);
  console.log(`✅ Built: ${filename}`);
});
console.log('\nAll pages built successfully!');
