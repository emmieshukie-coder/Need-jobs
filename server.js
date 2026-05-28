import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import pkg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const { Pool } = pkg;

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// API Keys - move these to Render Environment Variables for safety
const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID || 'cd82aca8';
const ADZUNA_API_KEY = process.env.ADZUNA_API_KEY || '39952eab2d2de243ff1ceffc7dc36478';
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '96a9c08353msh17930481ae22721p150e24jsn49eed442acdc';
const JOOBLE_API_KEY = process.env.JOOBLE_API_KEY || 'YOUR_JOOBLE_KEY';
const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY || 'FLWSECK_TEST-db21f2fde386569639177dd0b2786d06-X';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Tables
pool.query(`
  CREATE TABLE IF NOT EXISTS ads (
    id BIGINT PRIMARY KEY,
    token TEXT,
    type TEXT,
    status TEXT,
    title TEXT,
    company TEXT,
    location TEXT,
    phone TEXT,
    url TEXT,
    description TEXT,
    business TEXT,
    link TEXT,
    text TEXT,
    image TEXT,
    paymentref TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP
  )
`).catch(console.error);

pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  )
`).catch(console.error);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: { folder: 'jobai-ads', allowed_formats: ['jpg', 'png', 'jpeg', 'webp'], transformation: [{ width: 800, height: 600, crop: 'limit' }] }
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

let pendingPayments = {};
const AD_PRICE = 500;
const AD_DURATION_DAYS = 7;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Google site verification
app.get('/google765cda11c517c492.html', (req, res) => {
  res.send('google-site-verification: google765cda11c517c492.html');
});

// Main UI - keep your HTML as-is
app.get('/', (req, res) => {
  res.send(
    '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Jobai - Get Connected to Jobs & Workers</title><script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-app-pub-1637256996790764" crossorigin="anonymous"></script><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;margin:0;padding:0;background:#f5f7fa;color:#333;}.hero{background:linear-gradient(135deg,#1a73e8 0%,#0d47a1 100%);color:white;padding:40px 20px 30px;text-align:center;}.hero h1{font-size:32px;margin:0 0 8px 0;font-weight:700;}.hero p{font-size:16px;opacity:0.95;margin:0;}.container{max-width:1000px;margin:20px auto;padding:0 16px;}.controls{display:flex;gap:12px;margin-bottom:20px;align-items:center;flex-wrap:wrap;}.controls input,.controls select{padding:10px 14px;border-radius:8px;border:1px solid #ddd;font-size:14px;background:white;}.controls input{flex:1;min-width:200px;}.section{margin-bottom:32px;}.section h2{margin:0 0 16px 0;font-size:24px;color:#1a1a1a;}.job-card{background:white;padding:20px;margin-bottom:16px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.08);position:relative;transition:transform 0.2s,box-shadow 0.2s;display:block;text-decoration:none;color:inherit;}.job-card:hover{transform:translateY(-2px);box-shadow:0 4px 16px rgba(0,0,0,0.12);}.job-card h3{margin:8px 0 8px 0;color:#1a73e8;font-size:18px;line-height:1.4;}.job-meta{margin:0 0 14px 0;color:#666;font-size:14px;line-height:1.5;}.job-meta span{margin-right:8px;}.country-tag{display:inline-block;background:#e3f2fd;color:#1976d2;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:600;margin-bottom:8px;}.source-tag{display:inline-block;background:#f5f5f5;color:#666;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:500;margin-bottom:8px;margin-left:6px;}.user-ad-tag{background:#fff3e0;color:#f57c00;}.btn-group{display:flex;gap:10px;flex-wrap:wrap;}.connect-btn{display:inline-block;background:#1a73e8;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;transition:background 0.2s;border:none;cursor:pointer;}.connect-btn:hover{background:#1557b0;}.call-btn{background:#34a853;}.call-btn:hover{background:#2d9147;}.delete-btn{background:#d32f2f;}.delete-btn:hover{background:#b71c1c;}.edit-btn{background:#ff9800;}.edit-btn:hover{background:#f57c00;}.loading{text-align:center;color:#666;padding:30px;font-size:16px;}.error{text-align:center;color:#d32f2f;padding:30px;}.ad-form{background:white;padding:20px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.08);margin-bottom:24px;}.ad-form input,.ad-form textarea{width:100%;padding:10px;margin-bottom:12px;border:1px solid #ddd;border-radius:8px;font-size:14px;box-sizing:border-box;font-family:inherit;}.ad-form h3{margin-top:0;font-size:18px;}.phone-display{color:#34a853;font-weight:600;}.ad-unit{margin:0;padding:0;min-height:0;}.ad-unit ins.adsbygoogle[data-ad-status="unfilled"]{display:none!important;}.img-preview{max-width:100%;max-height:200px;border-radius:8px;margin-bottom:10px;display:none;}.card-actions{position:absolute;top:12px;right:12px;display:flex;flex-direction:column;gap:6px;}.icon-btn{width:32px;height:32px;border-radius:6px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:white;font-size:16px;}.modal{display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:1000;align-items:center;justify-content:center;}.modal.active{display:flex;}.modal-content{background:white;padding:24px;border-radius:12px;max-width:500px;width:90%;}.auth-form input{width:100%;padding:10px;margin-bottom:10px;border:1px solid #ddd;border-radius:8px;font-size:14px;box-sizing:border-box;}.auth-toggle{text-align:center;margin-top:10px;font-size:13px;color:#666;cursor:pointer;}.logout-btn{display:none;width:100%;margin-top:10px;background:#d32f2f;}</style></head><body><button id="menuBtn" aria-label="Open menu" style="position:fixed;top:14px;left:14px;z-index:1001;background:#fff;border:0;border-radius:8px;padding:10px 12px;box-shadow:0 2px 8px rgba(0,0,0,.15);cursor:pointer;font-size:18px;">☰</button><div id="overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:1000;" onclick="closeMenu()"></div><nav id="sideMenu" aria-hidden="true" style="position:fixed;top:0;left:-320px;width:300px;max-width:85%;height:100%;background:#fff;z-index:1002;transition:left 0.28s ease;box-shadow:2px 0 16px rgba(0,0,0,.12);overflow-y:auto;"><div style="padding:20px;border-bottom:1px solid #eee;"><h2 style="margin:0;color:#1a73e8;font-size:22px;">Jobai</h2><p style="margin:6px 0 0;font-size:13px;color:#666;">Get Connected to Jobs & Workers</p></div><div id="authSection" style="padding:16px;border-bottom:1px solid #eee;"><h3 id="authTitle" style="margin:0 0 12px 0;font-size:16px;">Sign Up</h3><div id="signupForm" class="auth-form"><input type="text" id="firstName" placeholder="First Name" required><input type="text" id="lastName" placeholder="Last Name" required><input type="email" id="signupEmail" placeholder="Email" required><input type="tel" id="signupPhone" placeholder="Phone Number"><input type="password" id="signupPassword" placeholder="Password" required><input type="password" id="confirmPassword" placeholder="Confirm Password" required><button class="connect-btn" style="width:100%;" onclick="signup()">Create Account</button><p id="signupMsg" style="font-size:12px;margin-top:8px;"></p></div><div id="loginForm" class="auth-form" style="display:none;"><input type="email" id="loginEmail" placeholder="Email" required><input type="password" id="loginPassword" placeholder="Password" required><button class="connect-btn" style="width:100%;" onclick="login()">Login</button><p id="loginMsg" style="font-size:12px;margin-top:8px;"></p></div><div class="auth-toggle" onclick="toggleAuth()">Already have an account? <b>Login</b></div><button id="logoutBtn" class="connect-btn logout-btn" onclick="logout()">Logout</button><p id="userInfo" style="font-size:13px;margin-top:8px;color:#1a73e8;"></p></div><div style="padding:8px 0;"><a href="#" onclick="closeMenu();document.getElementById('searchInput')?.focus();" style="display:flex;align-items:center;gap:12px;padding:14px 18px;text-decoration:none;color:#222;font-size:15px;">🔍 <span>Job Search</span></a><a href="#" onclick="showFavorites()" style="display:flex;align-items:center;gap:12px;padding:14px 18px;text-decoration:none;color:#222;font-size:15px;">❤️ <span>Favorites</span></a><a href="#" onclick="scrollToId('adForm')" style="display:flex;align-items:center;gap:12px;padding:14px 18px;text-decoration:none;color:#222;font-size:15px;">📄 <span>Post a Job</span> <span style="background:#ff9800;color:#fff;padding:2px 8px;border-radius:12px;font-size:11px;margin-left:auto;">New</span></a><a href="#" onclick="showSalaries()" style="display:flex;align-items:center;gap:12px;padding:14px 18px;text-decoration:none;color:#222;font-size:15px;">📊 <span>Salaries</span></a><a href="#" onclick="showSubscriptions()" style="display:flex;align-items:center;gap:12px;padding:14px 18px;text-decoration:none;color:#222;font-size:15px;">✉️ <span>Job Alerts</span></a><a href="#" onclick="scrollToId('paidAds')" style="display:flex;align-items:center;gap:12px;padding:14px 18px;text-decoration:none;color:#222;font-size:15px;">💼 <span>Sponsored Ads</span></a></div><div style="padding:16px 18px;border-top:1px solid #eee;font-size:13px;color:#666;">Never miss new jobs on Jobai</div></nav><div class="hero"><h1>Get Connected to Jobs & Workers</h1><p>AI-powered matching for Uganda, Kenya, Tanzania, Rwanda, Burundi, India, UAE, Saudi Arabia, France, UK, Canada, China, Taiwan, Thailand</p></div><div class="ad-unit"><ins class="adsbygoogle" style="display:block" data-ad-client="ca-app-pub-1637256996790764" data-ad-slot="5321979598" data-ad-format="auto" data-full-width-responsive="true"></ins><script>(adsbygoogle = window.adsbygoogle || []).push({});</script></div><div class="container"><div class="controls"><input type="text" id="searchInput" placeholder="Search: cleaner, nurse, teacher, engineer, farmer..."/><select id="dateFilter"><option value="7">Last 7 days</option><option value="all">All time</option><option value="3">Last 3 days</option><option value="1">Last 24 hours</option></select><button class="connect-btn" id="searchBtn">Search</button></div><div class="section"><h2>Trending Jobs</h2><div id="jobs" class="loading">Loading jobs...</div></div><div class="ad-unit"><ins class="adsbygoogle" style="display:block" data-ad-client="ca-app-pub-1637256996790764" data-ad-slot="5321979598" data-ad-format="auto" data-full-width-responsive="true"></ins><script>(adsbygoogle = window.adsbygoogle || []).push({});</script></div><div class="section"><h2>Post a Job</h2><div class="ad-form" id="adForm"><h3>Advertise your job for 200 KES</h3><input type="text" id="adTitle" placeholder="Job title" required><input type="text" id="adCompany" placeholder="Company name" required><input type="text" id="adLocation" placeholder="Location" required><input type="tel" id="adPhone" placeholder="Phone number for applicants"><input type="url" id="adUrl" placeholder="Apply link (optional)"><textarea id="adDesc" placeholder="Short description" rows="3"></textarea><button class="connect-btn" onclick="submitAd()">Pay 200 KES & Post Job</button><p id="adMsg" style="margin-top:10px;font-size:14px;"></p></div><h2>Community Job Posts</h2><div id="userAds" class="loading">Loading...</div></div><div class="section"><h2>Sponsored Ads</h2><div class="ad-form"><h3>Advertise here for 500 KES for 7 days</h3><input type="text" id="adBizName" placeholder="Business name" required><input type="url" id="adLink" placeholder="Website or WhatsApp link" required><input type="text" id="adText" placeholder="Short ad text" required><input type="file" id="adImgFile" accept="image/*" capture="environment"><img id="imgPreview" class="img-preview"/><input type="hidden" id="adImgUrl"><button class="connect-btn" style="background:#f57c00;" onclick="submitPaidAd()">Pay 500 KES & Run Ad</button><p id="adPayMsg" style="margin-top:10px;font-size:14px;"></p></div><div id="paidAds" class="loading">Loading ads...</div></div></div><div id="editModal" class="modal"><div class="modal-content"><h3>Edit Ad</h3><input type="hidden" id="editId"><input type="hidden" id="editToken"><input type="hidden" id="editType"><input type="text" id="editTitle" placeholder="Title/Business"><input type="text" id="editLocation" placeholder="Location"><input type="text" id="editCompany" placeholder="Company"><textarea id="editDesc" placeholder="Description" rows="3"></textarea><div class="btn-group" style="margin-top:16px;"><button class="connect-btn" onclick="saveEdit()">Save</button><button class="connect-btn" style="background:#666;" onclick="closeEdit()">Cancel</button></div></div></div><script>function openMenu(){document.getElementById('sideMenu').style.left='0';document.getElementById('overlay').style.display='block';document.getElementById('sideMenu').setAttribute('aria-hidden','false');}function closeMenu(){document.getElementById('sideMenu').style.left='-320px';document.getElementById('overlay').style.display='none';document.getElementById('sideMenu').setAttribute('aria-hidden','true');}function scrollToId(id){closeMenu();const el=document.getElementById(id);if(el)el.scrollIntoView({behavior:'smooth',block:'start'});}function showFavorites(){closeMenu();const fav=JSON.parse(localStorage.getItem('jobai_fav')||'[]');if(!fav.length){alert('No favorites yet. Click "Connect & Apply" then save the job link.');return;}renderJobs(fav);document.querySelector('.section h2').textContent='Favorites';}function showSalaries(){closeMenu();alert('Salaries coming next. We will wire this to Adzuna Salary API.');}function showSubscriptions(){closeMenu();alert('Job Alerts coming next. Enter email + keywords and get notified.');}function toggleAuth(){const s=document.getElementById('signupForm'),l=document.getElementById('loginForm'),t=document.getElementById('authTitle');if(s.style.display==='none'){s.style.display='block';l.style.display='none';t.textContent='Sign Up';}else{s.style.display='none';l.style.display='block';t.textContent='Login';}}async function signup(){const first=document.getElementById('firstName').value.trim(),last=document.getElementById('lastName').value.trim(),email=document.getElementById('signupEmail').value.trim(),phone=document.getElementById('signupPhone').value.trim(),pass=document.getElementById('signupPassword').value,cpass=document.getElementById('confirmPassword').value;const msg=document.getElementById('signupMsg');if(!first||!last||!email||!pass){msg.textContent='Fill all required fields';msg.style.color='red';return;}if(pass!==cpass){msg.textContent='Passwords do not match';msg.style.color='red';return;}msg.textContent='Creating account...';msg.style.color='blue';const res=await fetch('/auth/signup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({firstName:first,lastName:last,email,phone,password:pass})});const data=await res.json();if(data.success){msg.textContent='Account created! You can login now.';msg.style.color='green';toggleAuth();}else{msg.textContent=data.error||'Signup failed';msg.style.color='red';}}async function login(){const email=document.getElementById('loginEmail').value.trim(),pass=document.getElementById('loginPassword').value;const msg=document.getElementById('loginMsg');if(!email||!pass){msg.textContent='Enter email and password';msg.style.color='red';return;}msg.textContent='Logging in...';msg.style.color='blue';const res=await fetch('/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:pass})});const data=await res.json();if(data.success){msg.textContent='Login successful!';msg.style.color='green';localStorage.setItem('jobai_user',JSON.stringify(data.user));updateAuthUI(data.user);closeMenu();}else{msg.textContent=data.error||'Login failed';msg.style.color='red';}}async function logout(){await fetch('/auth/logout',{method:'POST'});localStorage.removeItem('jobai_user');updateAuthUI(null);}function updateAuthUI(user){const logout=document.getElementById('logoutBtn');const info=document.getElementById('userInfo');if(user){document.getElementById('signupForm').style.display='none';document.getElementById('loginForm').style.display='none';document.getElementById('authTitle').textContent='Account';logout.style.display='block';info.textContent='Logged in as '+user.first_name+' '+user.last_name;}else{document.getElementById('signupForm').style.display='block';document.getElementById('loginForm').style.display='none';document.getElementById('authTitle').textContent='Sign Up';logout.style.display='none';info.textContent='';}}window.addEventListener('load',()=>{const user=JSON.parse(localStorage.getItem('jobai_user')||'null');updateAuthUI(user);});document.getElementById('menuBtn').addEventListener('click',openMenu);let allJobs=[];document.getElementById("adImgFile").addEventListener("change",async function(e){const file=e.target.files[0];if(!file)return;const formData=new FormData();formData.append("image",file);document.getElementById("adPayMsg").textContent="Uploading image...";document.getElementById("adPayMsg").style.color="blue";try{const res=await fetch("/upload-ad-image",{method:"POST",body:formData});const data=await res.json();if(data.url){document.getElementById("adImgUrl").value=data.url;document.getElementById("imgPreview").src=data.url;document.getElementById("imgPreview").style.display="block";document.getElementById("adPayMsg").textContent="Image uploaded!";document.getElementById("adPayMsg").style.color="green";}else{document.getElementById("adPayMsg").textContent="Upload failed";document.getElementById("adPayMsg").style.color="red";}}catch(err){document.getElementById("adPayMsg").textContent="Upload error";document.getElementById("adPayMsg").style.color="red";}});function timeAgo(dateStr){if(!dateStr)return"";const date=new Date(dateStr);if(isNaN(date.getTime()))return"";const now=new Date();const diffMs=now-date;const diffDay=Math.floor(diffMs/(1000*60*60*24));if(diffDay>2)return"";if(diffMs<0)return"";const diffSec=Math.floor(diffMs/1000);const diffMin=Math.floor(diffSec/60);const diffHr=Math.floor(diffMin/60);if(diffSec<60)return"just now";if(diffMin<60)return diffMin+"m ago";if(diffHr<24)return diffHr+"h ago";if(diffDay===1)return"1d ago";return diffDay+"d ago";}function renderJobs(jobs){if(!jobs.length){document.getElementById("jobs").innerHTML='<div class="error">No jobs found.</div>';return;}document.getElementById("jobs").innerHTML=jobs.map(function(j){const timeStr=timeAgo(j.date_posted);const timePart=timeStr?`<span>•</span><span>${timeStr}</span>`:"";return'<a href="'+j.url+'"target="_blank"class="job-card"><span class="country-tag">'+j.country+'</span><span class="source-tag">'+j.source+'</span><h3>'+j.title+'</h3><p class="job-meta"><span>'+j.location+'</span><span>•</span><span>'+j.company+'</span>'+timePart+'</p><span class="connect-btn">Connect & Apply</span></a>';}).join("");}function renderUserAds(ads){if(!ads.length){document.getElementById("userAds").innerHTML='<div class="error">No community posts yet.</div>';return;}document.getElementById("userAds").innerHTML=ads.map(function(j){let buttons='<div class="btn-group">';if(j.url&&j.url!="#"){buttons+='<a href="'+j.url+'"target="_blank"class="connect-btn">Apply Now</a>';}if(j.phone){buttons+='<a href="tel:'+j.phone+'"class="connect-btn call-btn">Call'+j.phone+'</a>';}buttons+='</div>';let actions='<div class="card-actions">';actions+='<button class="icon-btn edit-btn"onclick="openEdit(\'user\',\''+j.id+'\',\''+j.token+'\')">✏️</button>';actions+='<button class="icon-btn delete-btn"onclick="deleteAd(\'user\',\''+j.id+'\',\''+j.token+'\')">🗑️</button>';actions+='</div>';const timeStr=timeAgo(j.created_at);const timeHtml=timeStr?`<span class="source-tag">${timeStr}</span>`:"";return'<div class="job-card"style="position:relative">'+actions+'<span class="country-tag user-ad-tag">Community</span>'+timeHtml+'<h3>'+j.title+'</h3><p class="job-meta"><span>'+j.location+'</span><span>•</span><span>'+j.company+'</span></p><p>'+(j.description||"")+'</p><p class="phone-display">'+(j.phone?"Phone:"+j.phone:"")+'</p>'+buttons+'</div>';}).join("");}function renderPaidAds(ads){if(!ads.length){document.getElementById("paidAds").innerHTML='<div class="error">No sponsors yet.</div>';return;}document.getElementById("paidAds").innerHTML=ads.map(function(ad){let img=ad.image?'<img src="'+ad.image+'"style="width:100%;max-height:200px;object-fit:cover;border-radius:8px;margin-bottom:10px;">':'';let actions='<div class="card-actions">';actions+='<button class="icon-btn edit-btn"onclick="openEdit(\'paid\',\''+ad.id+'\',\''+ad.token+'\')">✏️</button>';actions+='<button class="icon-btn delete-btn"onclick="deleteAd(\'paid\',\''+ad.id+'\',\''+ad.token+'\')">🗑️</button>';actions+='</div>';const timeStr=timeAgo(ad.created_at)||"Just posted";const timeHtml=`<span class="source-tag">${timeStr}</span>`;return'<div class="job-card"style="border:2px solid #f57c00;position:relative;">'+actions+'<span class="country-tag user-ad-tag">Sponsored</span>'+timeHtml+img+'<h3>'+ad.business+'</h3><p>'+ad.text+'</p><a href="'+ad.link+'"target="_blank"class="connect-btn"style="background:#f57c00;">Visit</a></div>';}).join("");}function openEdit(type,id,token){document.getElementById("editType").value=type;document.getElementById("editId").value=id;document.getElementById("editToken").value=token;document.getElementById("editModal").classList.add("active");}function closeEdit(){document.getElementById("editModal").classList.remove("active");}async function saveEdit(){const type=document.getElementById("editType").value;const id=document.getElementById("editId").value;const token=document.getElementById("editToken").value;const data={id,token,title:document.getElementById("editTitle").value,location:document.getElementById("editLocation").value,company:document.getElementById("editCompany").value,description:document.getElementById("editDesc").value};const endpoint=type==="paid"?"/paid-ads/edit":"/ads/edit";const res=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});const result=await res.json();if(result.success){closeEdit();loadUserAds();loadPaidAds();alert("Updated successfully");}else{alert("Update failed");}}async function deleteAd(type,id,token){if(!confirm("Delete this ad?"))return;const endpoint=type==="paid"?"/paid-ads/delete":"/ads/delete";const res=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,token})});const result=await res.json();if(result.success){loadUserAds();loadPaidAds();alert("Deleted successfully");}else{alert("Delete failed");}}async function loadJobs(){const query=document.getElementById("searchInput").value||"cleaner OR helper OR maid OR nurse OR teacher OR engineer OR farmer OR manager OR shop attendant OR software engineer OR data scientist OR doctor OR surgeon OR pilot OR lawyer OR finance manager OR investment banker OR petroleum engineer OR AI engineer";const days=document.getElementById("dateFilter").value;document.getElementById("jobs").innerHTML='<div class="loading">Loading jobs...</div>';try{const res=await fetch("/jobs?query="+encodeURIComponent(query)+"&recent="+days);allJobs=await res.json();renderJobs(allJobs);}catch(e){document.getElementById("jobs").innerHTML='<div class="error">Failed to load jobs.</div>';}}async function loadUserAds(){const res=await fetch("/ads");const ads=await res.json();renderUserAds(ads);}async function loadPaidAds(){const res=await fetch("/paid-ads");const ads=await res.json();renderPaidAds(ads);}async function submitAd(){const data={title:document.getElementById("adTitle").value,company:document.getElementById("adCompany").value,location:document.getElementById("adLocation").value,phone:document.getElementById("adPhone").value,url:document.getElementById("adUrl").value,description:document.getElementById("adDesc").value};if(!data.title||!data.company||!data.location){document.getElementById("adMsg").textContent="Please fill title,company and location.";document.getElementById("adMsg").style.color="red";return;}document.getElementById("adMsg").textContent="Redirecting to payment...";document.getElementById("adMsg").style.color="blue";const res=await fetch("/ads/initiate-payment",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});const result=await res.json();if(result.payment_link){window.location.href=result.payment_link;}else{document.getElementById("adMsg").textContent="Payment failed.Try again.";document.getElementById("adMsg").style.color="red";}}async function submitPaidAd(){const data={business:document.getElementById("adBizName").value,link:document.getElementById("adLink").value,text:document.getElementById("adText").value,image:document.getElementById("adImgUrl").value};if(!data.business||!data.link||!data.text){document.getElementById("adPayMsg").textContent="Fill business,link and text.";document.getElementById("adPayMsg").style.color="red";return;}document.getElementById("adPayMsg").textContent="Redirecting to payment...";document.getElementById("adPayMsg").style.color="blue";const res=await fetch("/paid-ads/initiate-payment",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});const result=await res.json();if(result.payment_link){window.location.href=result.payment_link;}else{document.getElementById("adPayMsg").textContent="Payment failed.Try again.";document.getElementById("adPayMsg").style.color="red";}}const urlParams=new URLSearchParams(window.location.search);if(urlParams.get("payment")==="success"){document.getElementById("adMsg").textContent="Payment successful!Job posted.";document.getElementById("adMsg").style.color="green";loadUserAds();loadPaidAds();}if(urlParams.get("payment")==="failed"){document.getElementById("adMsg").textContent="Payment failed or cancelled.";document.getElementById("adMsg").style.color="red";}document.getElementById("searchBtn").addEventListener("click",loadJobs);document.getElementById("dateFilter").addEventListener("change",loadJobs);document.getElementById("searchInput").addEventListener("keypress",function(e){if(e.key==="Enter")loadJobs();});loadJobs();loadUserAds();loadPaidAds();</script><footer style="text-align:center;padding:24px 10px;font-size:13px;color:#888;margin-top:60px;border-top:1px solid #eee;">Sponsored by<strong style="color:#333;">EmmieTechUg</strong>|Contact:emmieshukie at gmail dot com</footer></body></html>'
  );
});

// Upload image route
app.post('/upload-ad-image', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ url: req.file.path });
});

// Auth routes
app.post('/auth/signup', async (req, res) => {
  const { firstName, lastName, email, phone, password } = req.body;
  if (!firstName ||!lastName ||!email ||!password) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (first_name, last_name, email, phone, password_hash) VALUES ($1, $2, $3, $4, $5) RETURNING id, first_name, last_name, email`,
      [firstName, lastName, email, phone, hash]
    );
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      res.status(400).json({ success: false, error: 'Email already exists' });
    } else {
      console.error(err);
      res.status(500).json({ success: false, error: 'Signup failed' });
    }
  }
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email ||!password) {
    return res.status(400).json({ success: false, error: 'Missing email or password' });
  }
  try {
    const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, error: 'Invalid email or password' });
    }
        const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(400).json({ success: false, error: 'Invalid email or password' });
    }
    res.json({ success: true, user: { id: user.id, first_name: user.first_name, last_name: user.last_name, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

app.post('/auth/logout', (req, res) => {
  res.json({ success: true });
});

// Job API fetchers
async function fetchAdzunaJobs(countryCode, countryName, query) {
  try {
    const url = `https://api.adzuna.com/v1/api/jobs/${countryCode}/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_API_KEY}&results_per_page=20&content-type=application/json&max_days_old=7&what=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = await response.json();
    return (data.results || []).map(j => ({
      title: j.title || 'Job Title',
      company: j.company?.display_name || 'Unknown Company',
      location: j.location?.display_name || countryName,
      country: countryName,
      url: j.redirect_url || '#',
      date_posted: j.created,
      source: 'Adzuna'
    }));
  } catch (err) {
    return [];
  }
}

async function fetchJSearchJobs(query, location) {
  try {
    const url = `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}&num_pages=1&date_posted=week`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
      }
    });
    if (!response.ok) return [];
    const data = await response.json();
    return (data.data || []).map(j => ({
      title: j.job_title || 'Job Title',
      company: j.employer_name || 'Unknown Company',
      location: j.job_city || location,
      country: location,
      url: j.job_apply_link || '#',
      date_posted: j.job_posted_at_datetime_utc,
      source: j.job_publisher || 'JSearch'
    }));
  } catch (err) {
    return [];
  }
}

async function fetchJoobleJobs(query, location) {
  if (JOOBLE_API_KEY === 'YOUR_JOOBLE_KEY') return [];
  try {
    const response = await fetch(`https://jooble.org/api/${JOOBLE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        keywords: query,
        location: location,
        page: 1,
        resultsOnPage: 20
      })
    });
    if (!response.ok) return [];
    const data = await response.json();
    return (data.jobs || []).map(j => ({
      title: j.title,
      company: j.company,
      location: j.location,
      country: location,
      url: j.link,
      date_posted: j.updated,
      source: 'Jooble'
    }));
  } catch (err) {
    return [];
  }
}

async function fetchRemotiveJobs(query) {
  try {
    const response = await fetch(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(query)}`);
    if (!response.ok) return [];
    const data = await response.json();
    return (data.jobs || []).map(j => ({
      title: j.title,
      company: j.company_name,
      location: 'Remote',
      country: 'Global',
      url: j.url,
      date_posted: j.date,
      source: 'Remotive'
    }));
  } catch (err) {
    return [];
  }
}

// Jobs route
app.get('/jobs', async (req, res) => {
  try {
    const query = req.query || 'cleaner OR helper OR maid OR nurse OR teacher OR engineer OR farmer OR manager OR shop attendant OR software engineer OR data scientist OR doctor OR surgeon OR pilot OR lawyer OR finance manager OR investment banker OR petroleum engineer OR AI engineer';
    const recentDays = parseInt(req.query.recent) || 7;

    const countries = [
      { code: 'sa', name: 'Saudi Arabia' },
      { code: 'ae', name: 'United Arab Emirates' },
      { code: 'gb', name: 'United Kingdom' },
      { code: 'in', name: 'India' },
      { code: 'ug', name: 'Uganda' },
      { code: 'ke', name: 'Kenya' },
      { code: 'tz', name: 'Tanzania' },
      { code: 'za', name: 'South Africa' },
      { code: 'au', name: 'Australia' },
      { code: 'us', name: 'United States' },
      { code: 'rw', name: 'Rwanda' },
      { code: 'bi', name: 'Burundi' }
    ];

    let allJobs = [];

    const promises = [];
    for (let i = 0; i < countries.length; i++) {
      promises.push(fetchAdzunaJobs(countries[i].code, countries[i].name, query));
      promises.push(fetchJSearchJobs(query, countries[i].name));
      if (JOOBLE_API_KEY!== 'YOUR_JOOBLE_KEY') {
        promises.push(fetchJoobleJobs(query, countries[i].name));
      }
    }
    promises.push(fetchRemotiveJobs(query));

    const results = await Promise.allSettled(promises);
    results.forEach(r => {
      if (r.status === 'fulfilled' && r.value) {
        allJobs.push(...r.value);
      }
    });

        allJobs = allJobs.filter((job, index, self) =>
      index === self.findIndex(j => j.url === job.url)
    );

    if (recentDays > 0 && recentDays!== 'all') {
      const cutoff = Date.now() - recentDays * 24 * 60 * 60 * 1000;
      allJobs = allJobs.filter(j => j.date_posted && new Date(j.date_posted).getTime() > cutoff);
    }

    allJobs.sort((a, b) => new Date(b.date_posted) - new Date(a.date_posted));

    res.json(allJobs.slice(0, 100));
  } catch (err) {
    console.error('Jobs fetch error:', err);
    res.json([]);
  }
});

// Ads routes
app.get('/ads', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM ads WHERE type = 'job' AND status = 'approved' ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/paid-ads', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM ads WHERE type = 'ad' AND status = 'approved' AND expires_at > NOW() ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Payment routes
app.post('/ads/initiate-payment', async (req, res) => {
  const { title, company, location, phone, url, description } = req.body;
  if (!title ||!company ||!location) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const tx_ref = 'jobai_' + Date.now();
  const token = crypto.randomBytes(16).toString('hex');
  pendingPayments[tx_ref] = { title, company, location, phone, url, description, type: 'job', token };

  try {
    const response = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FLW_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tx_ref,
        amount: 200,
        currency: 'KES',
        redirect_url: `https://jobai-landing.onrender.com/payment-callback`,
        customer: { email: 'customer@jobai.com', phonenumber: phone || '0700000', name: company },
        customizations: { title: 'Job Post Payment', description: 'Pay 200 KES to post job on Jobai' }
      })
    });

    const data = await response.json();
    if (data.status === 'success') {
      res.json({ payment_link: data.data.link });
    } else {
      res.status(400).json({ error: 'Failed to create payment' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Payment error' });
  }
});

app.post('/paid-ads/initiate-payment', async (req, res) => {
  const { business, link, text, image } = req.body;
  if (!business ||!link ||!text) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const tx_ref = 'ad_' + Date.now();
  const token = crypto.randomBytes(16).toString('hex');
  pendingPayments[tx_ref] = { business, link, text, image, type: 'ad', token };

  try {
    const response = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FLW_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tx_ref,
        amount: AD_PRICE,
        currency: 'KES',
        redirect_url: `https://jobai-landing.onrender.com/payment-callback`,
        customer: { email: 'advertiser@jobai.com', name: business },
        customizations: { title: 'Sponsored Ad Payment', description: 'Pay ' + AD_PRICE + ' KES for 7 days ad' }
      })
    });

    const data = await response.json();
    if (data.status === 'success') {
      res.json({ payment_link: data.data.link });
    } else {
      res.status(400).json({ error: 'Failed to create payment' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Payment error' });
  }
});

app.get('/payment-callback', async (req, res) => {
  const { transaction_id, tx_ref } = req.query;

  try {
    const response = await fetch(`https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`, {
      headers: { 'Authorization': `Bearer ${FLW_SECRET_KEY}` }
    });
    const data = await response.json();

    if (data.status === 'success' && data.data.status === 'successful') {
      const jobData = pendingPayments[tx_ref];
      if (jobData) {
        const id = Date.now() + Math.floor(Math.random() * 1000);
        const expires = new Date();
        expires.setDate(expires.getDate() + AD_DURATION_DAYS);

        if (jobData.type === 'ad') {
          await pool.query(
            `INSERT INTO ads (id, token, type, status, business, link, text, image, paymentref, expires_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [id, jobData.token, 'ad', 'approved', jobData.business, jobData.link, jobData.text, jobData.image, transaction_id, expires]
          );
        } else {
          await pool.query(
            `INSERT INTO ads (id, token, type, status, title, company, location, phone, url, description, paymentref, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())`,
            [id, jobData.token, 'job', 'approved', jobData.title, jobData.company, jobData.location, jobData.phone, jobData.url, jobData.description, transaction_id]
          );
        }
        delete pendingPayments[tx_ref];
        res.redirect('/?payment=success');
      } else {
        res.redirect('/?payment=failed');
      }
    } else {
      res.redirect('/?payment=failed');
    }
  } catch (err) {
    console.error(err);
    res.redirect('/?payment=failed');
  }
});

// Edit/Delete routes
app.post('/ads/edit', async (req, res) => {
  const { id, token, title, location, company, description } = req.body;
  try {
    const result = await pool.query(
      `UPDATE ads SET title = COALESCE($1, title), location = COALESCE($2, location),
       company = COALESCE($3, company), description = COALESCE($4, description)
       WHERE id = $5 AND token = $6 AND type = 'job' RETURNING id`,
      [title, location, company, description, id, token]
    );
    res.json({ success: result.rowCount > 0 });
  } catch (err) {
    console.error(err);
    res.json({ success: false });
  }
});

app.post('/ads/delete', async (req, res) => {
  const { id, token } = req.body;
  try {
    const result = await pool.query(
      `DELETE FROM ads WHERE id = $1 AND token = $2 AND type = 'job' RETURNING id`,
      [id, token]
    );
    res.json({ success: result.rowCount > 0 });
  } catch (err) {
    console.error(err);
    res.json({ success: false });
  }
});

app.post('/paid-ads/edit', async (req, res) => {
  const { id, token, title, location, company, description } = req.body;
  try {
    const result = await pool.query(
      `UPDATE ads SET business = COALESCE($1, business), text = COALESCE($2, text),
       location = COALESCE($3, location), company = COALESCE($4, company)
       WHERE id = $5 AND token = $6 AND type = 'ad' RETURNING id`,
      [title, description, location, company, id, token]
    );
    res.json({ success: result.rowCount > 0 });
  } catch (err) {
    console.error(err);
    res.json({ success: false });
  }
});

app.post('/paid-ads/delete', async (req, res) => {
  const { id, token } = req.body;
  try {
    const result = await pool.query(
      `DELETE FROM ads WHERE id = $1 AND token = $2 AND type = 'ad' RETURNING id`,
      [id, token]
    );
    res.json({ success: result.rowCount > 0 });
  } catch (err) {
    console.error(err);
    res.json({ success: false });
  }
});

app.listen(PORT, function() {
  console.log('Server running on port ' + PORT);
});
