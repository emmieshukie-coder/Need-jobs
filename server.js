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

import sitemapRouter from './sitemap.js';

const { Pool } = pkg;

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ADZUNA_APP_ID = 'cd82aca8';
const ADZUNA_API_KEY = '39952eab2d2de243ff1ceffc7dc36478';
const RAPIDAPI_KEY = '96a9c08353msh17930481ae22721p150e24jsn49eed442acdc';
const JOOBLE_API_KEY = 'YOUR_JOOBLE_KEY';
const FLW_SECRET_KEY = 'FLWSECK_TEST-db21f2fde386569639177dd0b2786d06-X';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(sitemapRouter);

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
    sponsored BOOLEAN DEFAULT false,
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
    phone TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  )
`).catch(console.error);

const SPONSORED_ADS = [
  {
    id: 999001,
    title: "URGENT: 50 House Maids Needed Dubai - 2000 AED + Free Visa",
    company: "EmmieTech Recruitment",
    location: "Dubai, UAE",
    phone: "+971500000000",
    url: "https://wa.me/971500000000",
    description: "No experience needed. Free accommodation, food, transport. Legal contracts. Interview this week.",
    sponsored: true,
    created_at: new Date().toISOString()
  },
  {
    id: 999002,
    title: "Security Guards - Dubai Mall - 3000 AED Salary",
    company: "EmmieTech Recruitment",
    location: "Dubai, UAE",
    phone: "+971500000000",
    url: "https://wa.me/971500000000",
    description: "SIRA license provided. 12hr shifts. Free accommodation. Start immediately.",
    sponsored: true,
    created_at: new Date().toISOString()
  }
];

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

const DIRECT_EMPLOYERS = [
  { 
    title: "Housekeeping Attendant - Free Visa + Accommodation", 
    company: "Emirates Group Careers", 
    location: "Dubai, UAE", 
    phone: "+97143877788", 
    url: "https://www.emiratesgroupcareers.com/search/?searchby=location&createNewAlert=false&q=&locationsearch=dubai", 
    country: "UAE", 
    source: "Direct Partner", 
    date_posted: new Date().toISOString() 
  },
  { 
    title: "Security Guard - SIRA License Provided", 
    company: "G4S UAE", 
    location: "Dubai, UAE", 
    phone: "+97126911200", 
    url: "https://careers.g4s.com/en/search-results?keywords=&location=Dubai", 
    country: "UAE", 
    source: "Direct Partner", 
    date_posted: new Date().toISOString() 
  },
  { 
    title: "Light Vehicle Driver - 2500 AED", 
    company: "Al-Futtaim Logistics", 
    location: "Dubai, UAE", 
    phone: "+97142552000", 
    url: "https://www.alfuttaim.com/careers/find-a-job/", 
    country: "UAE", 
    source: "Direct Partner", 
    date_posted: new Date().toISOString() 
  },
  { 
    title: "Hotel Staff - Housekeeping/Room Attendant", 
    company: "Jumeirah Group", 
    location: "Dubai, UAE", 
    phone: "+97143667777", 
    url: "https://www.jumeirah.com/en/careers/vacancies", 
    country: "UAE", 
    source: "Direct Partner", 
    date_posted: new Date().toISOString() 
  },
  { 
    title: "Construction Worker - NEOM Project", 
    company: "Saudi Binladin Group", 
    location: "Riyadh, Saudi Arabia", 
    phone: "+966112899999", 
    url: "https://careers.sbg.com.sa/", 
    country: "Saudi Arabia", 
    source: "Direct Partner", 
    date_posted: new Date().toISOString() 
  },
  { 
    title: "Nurse - Female Only - MOH Saudi", 
    company: "King Faisal Specialist Hospital", 
    location: "Riyadh, Saudi Arabia", 
    phone: "+966114647272", 
    url: "https://careers.kfshrc.edu.sa/", 
    country: "Saudi Arabia", 
    source: "Direct Partner", 
    date_posted: new Date().toISOString() 
  },
  { 
    title: "Airport Staff - Hamad International", 
    company: "Qatar Airways Group", 
    location: "Doha, Qatar", 
    phone: "+97440230000", 
    url: "https://careers.qatarairways.com/global/en/search-results", 
    country: "Qatar", 
    source: "Direct Partner", 
    date_posted: new Date().toISOString() 
  },
  { 
    title: "Facility Management Staff", 
    company: "Qatar Foundation", 
    location: "Doha, Qatar", 
    phone: "+97444540000", 
    url: "https://careers.qf.org.qa/", 
    country: "Qatar", 
    source: "Direct Partner", 
    date_posted: new Date().toISOString() 
  },
  { 
    title: "General Farm Worker - LMIA Available", 
    company: "Job Bank Canada", 
    location: "Ontario, Canada", 
    phone: "+18006266237", 
    url: "https://www.jobbank.gc.ca/jobsearch/jobsearch?searchstring=farm+worker&locationstring=Canada", 
    country: "Canada", 
    source: "Direct Partner", 
    date_posted: new Date().toISOString() 
  },
  { 
    title: "Caregiver - Live-in Program", 
    company: "Canada.ca Immigration Jobs", 
    location: "Toronto, Canada", 
    phone: "+18006266237", 
    url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/caregivers.html", 
    country: "Canada", 
    source: "Direct Partner", 
    date_posted: new Date().toISOString() 
  },
  { 
    title: "Truck Driver - Class 1 License", 
    company: "Job Bank Canada", 
    location: "Alberta, Canada", 
    phone: "+18006266237", 
    url: "https://www.jobbank.gc.ca/jobsearch/jobsearch?searchstring=truck+driver&locationstring=Canada", 
    country: "Canada", 
    source: "Direct Partner", 
    date_posted: new Date().toISOString() 
  },
  { 
    title: "Health Care Assistant - NHS Jobs", 
    company: "NHS UK", 
    location: "London, UK", 
    phone: "+443001311424", 
    url: "https://www.jobs.nhs.uk/candidate/search/results", 
    country: "UK", 
    source: "Direct Partner", 
    date_posted: new Date().toISOString() 
  },
  { 
    title: "Warehouse Operative - Visa Sponsorship", 
    company: "Indeed UK", 
    location: "Manchester, UK", 
    phone: "+448000261876", 
    url: "https://uk.indeed.com/jobs?q=visa+sponsorship+warehouse&l=United+Kingdom", 
    country: "UK", 
    source: "Direct Partner", 
    date_posted: new Date().toISOString() 
  }
];

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/google765cda11c517c492.html', (req, res) => {
  res.send('google-site-verification: google765cda11c517c492.html');
});

app.get('/', (req, res) => {
  res.send(
    '<!DOCTYPE html>' +
    '<html lang="en">' +
    '<head>' +
    ' <meta charset="UTF-8">' +
    ' <meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    ' <title>EmmieTech Recruitment - Uganda to Dubai, Canada, UK Jobs</title>' +
    ' <style>' +
    ' body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 0; padding: 0; background: #f5f7fa; color: #333; }' +
    '.hero { background: linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%); color: white; padding: 40px 20px 30px; text-align: center; }' +
    '.hero h1 { font-size: 32px; margin: 0 0 8px 0; font-weight: 700; }' +
    '.hero p { font-size: 16px; opacity: 0.95; margin: 0; }' +
    '.container { max-width: 1000px; margin: 20px auto; padding: 0 16px; }' +
    '.controls { display: flex; gap: 12px; margin-bottom: 20px; align-items: center; flex-wrap: wrap; }' +
    '.controls input,.controls select { padding: 10px 14px; border-radius: 8px; border: 1px solid #ddd; font-size: 14px; background: white; }' +
    '.controls input { flex: 1; min-width: 200px; }' +
    '.section { margin-bottom: 32px; }' +
    '.section h2 { margin: 0 0 16px 0; font-size: 24px; color: #1a1a1a; }' +
    '.job-card { background: white; padding: 20px; margin-bottom: 16px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); position: relative; transition: transform 0.2s, box-shadow 0.2s; display: block; text-decoration: none; color: inherit; }' +
    '.job-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.12); }' +
    '.job-card h3 { margin: 8px 0 8px 0; color: #1a73e8; font-size: 18px; line-height: 1.4; }' +
    '.job-meta { margin: 0 0 14px 0; color: #666; font-size: 14px; line-height: 1.5; }' +
    '.job-meta span { margin-right: 8px; }' +
    '.country-tag { display: inline-block; background: #e3f2fd; color: #1976d2; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 8px; }' +
    '.source-tag { display: inline-block; background: #f5f5f5; color: #666; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 500; margin-bottom: 8px; margin-left: 6px; }' +
    '.direct-tag { background: #e8f5e9; color: #2e7d32; }' +
    '.user-ad-tag { background: #fff3e0; color: #f57c00; }' +
    '.sponsored-tag { background: #ff6d00; color: white; font-weight: 700; }' +
    '.sponsored-card { border: 2px solid #ff6d00; background: #fff8f0; }' +
    '.btn-group { display: flex; gap: 10px; flex-wrap: wrap; }' +
    '.connect-btn { display: inline-block; background: #1a73e8; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; transition: background 0.2s; border: none; cursor: pointer; }' +
    '.connect-btn:hover { background: #1557b0; }' +
    '.call-btn { background: #34a853; }' +
    '.call-btn:hover { background: #2d9147; }' +
    '.loading { text-align: center; color: #666; padding: 30px; font-size: 16px; }' +
    '.error { text-align: center; color: #d32f2f; padding: 30px; }' +
    '.ad-form { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); margin-bottom: 24px; }' +
    '.ad-form input,.ad-form textarea { width: 100%; padding: 10px; margin-bottom: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; box-sizing: border-box; font-family: inherit; }' +
    '.ad-form h3 { margin-top: 0; font-size: 18px; }' +
    '.phone-display { color: #34a853; font-weight: 600; }' +
    '.auth-form input { width: 100%; padding: 12px; margin-bottom: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 15px; box-sizing: border-box; }' +
    '.auth-toggle { text-align:center;margin-top:12px;font-size:14px;color:#666;cursor:pointer; }' +
    '.logout-btn { width:100%; margin-top:10px; background:#d32f2f; }' +
    '#authModal { position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:2000;display:flex;align-items:center;justify-content:center;padding:20px; }' +
    '#authModalContent { background:white;border-radius:16px;padding:24px;max-width:400px;width:100%;box-shadow:0 8px 32px rgba(0,0,0,0.3); }' +
    '.auth-modal-title { font-size:22px;margin:0 0 8px 0;color:#1a73e8;text-align:center;font-weight:700; }' +
    '.auth-modal-subtitle { font-size:14px;margin:0 0 20px 0;color:#666;text-align:center; }' +
    '#mainContent { display:none; }' +
    ' </style>' +
    '</head>' +
    '<body>' +
    '<div id="authModal">' +
    ' <div id="authModalContent">' +
    ' <h2 class="auth-modal-title">EmmieTech Recruitment</h2>' +
    ' <p class="auth-modal-subtitle">Register to access verified Dubai, Canada, UK jobs. Free for workers.</p>' +
    ' <h3 id="authTitle" style="margin:0 0 16px 0;font-size:18px;text-align:center;">Worker Registration</h3>' +
    ' <div id="signupForm" class="auth-form">' +
    ' <input type="text" id="firstName" placeholder="First Name" required>' +
    ' <input type="text" id="lastName" placeholder="Last Name" required>' +
    ' <input type="email" id="signupEmail" placeholder="Email" required>' +
    ' <input type="tel" id="signupPhone" placeholder="WhatsApp Number" required>' +
    ' <input type="password" id="signupPassword" placeholder="Password" required>' +
    ' <input type="password" id="confirmPassword" placeholder="Confirm Password" required>' +
    ' <button class="connect-btn" style="width:100%;padding:14px;" onclick="signup()">Register for Jobs</button>' +
    ' <p id="signupMsg" style="font-size:13px;margin-top:10px;text-align:center;"></p>' +
    ' </div>' +
    ' <div id="loginForm" class="auth-form" style="display:none;">' +
    ' <input type="email" id="loginEmail" placeholder="Email" required>' +
    ' <input type="password" id="loginPassword" placeholder="Password" required>' +
    ' <button class="connect-btn" style="width:100%;padding:14px;" onclick="login()">Login</button>' +
    ' <p id="loginMsg" style="font-size:13px;margin-top:10px;text-align:center;"></p>' +
    ' </div>' +
    ' <div class="auth-toggle" onclick="toggleAuth()">Already registered? <b>Login</b></div>' +
    ' </div>' +
    '</div>' +
    '<div id="mainContent">' +
    '<button id="menuBtn" aria-label="Open menu" style="position:fixed;top:14px;left:14px;z-index:1001;background:#fff;border:0;border-radius:8px;padding:10px 12px;box-shadow:0 2px 8px rgba(0,0,0,.15);cursor:pointer;font-size:18px;">☰</button>' +
    '<div id="overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:1000;" onclick="closeMenu()"></div>' +
    '<nav id="sideMenu" aria-hidden="true" style="position:fixed;top:0;left:-320px;width:300px;max-width:85%;height:100%;background:#fff;z-index:1002;transition:left 0.28s ease;box-shadow:2px 0 16px rgba(0,0,0,.12);overflow-y:auto;">' +
    ' <div style="padding:20px;border-bottom:1px solid #eee;">' +
    ' <h2 style="margin:0;color:#1a73e8;font-size:22px;">EmmieTech Recruitment</h2>' +
    ' <p style="margin:6px 0 0;font-size:13px;color:#666;">Licensed Uganda → Dubai/Canada Agency</p>' +
    ' </div>' +
    ' <div style="padding:16px;border-bottom:1px solid #eee;">' +
    ' <p id="userInfo" style="font-size:14px;margin:0 0 12px 0;color:#1a73e8;font-weight:600;"></p>' +
    ' <button id="logoutBtn" class="connect-btn logout-btn" onclick="logout()">Logout</button>' +
    ' </div>' +
    '</nav>' +
    ' <div class="hero">' +
    ' <h1>EmmieTech Global Recruitment</h1>' +
    ' <p>We connect Ugandan workers to verified employers in UAE, Saudi, Qatar, Canada & UK. Legal contracts. No upfront fees to workers.</p>' +
    ' </div>' +
    ' <div class="container">' +
    ' <div class="controls">' +
    ' <input type="text" id="searchInput" placeholder="Search: dubai, canada, driver, maid, nurse, caregiver..." />' +
    ' <select id="dateFilter">' +
    ' <option value="all">All time</option>' +
    ' <option value="7">Last 7 days</option>' +
    ' <option value="3">Last 3 days</option>' +
    ' <option value="1">Last 24 hours</option>' +
    ' </select>' +
    ' <button class="connect-btn" id="searchBtn">Find Global Jobs</button>' +
    ' </div>' +
    ' <div class="section">' +
    ' <h2>🔥 Sponsored Jobs - Apply Now</h2>' +
    ' <div id="sponsoredAds" class="loading">Loading sponsored jobs...</div>' +
    ' </div>' +
    ' <div class="section">' +
    ' <h2>Verified Global Jobs - Apply Direct</h2>' +
    ' <div id="jobs" class="loading">Loading verified jobs...</div>' +
    ' </div>' +
    ' <div class="section">' +
    ' <h2>Employers: Hire from Uganda - 200 KES</h2>' +
    ' <div class="ad-form" id="adForm">' +
    ' <h3>Post your Dubai/Canada job opening</h3>' +
    ' <input type="text" id="adTitle" placeholder="Job title - e.g. Caregiver Needed Canada" required>' +
    ' <input type="text" id="adCompany" placeholder="Company name" required>' +
    ' <input type="text" id="adLocation" placeholder="Location - Dubai, Toronto, London" required>' +
    ' <input type="tel" id="adPhone" placeholder="WhatsApp for applicants" required>' +
    ' <input type="url" id="adUrl" placeholder="Company website (optional)">' +
    ' <textarea id="adDesc" placeholder="Salary, benefits, requirements, visa provided?" rows="3"></textarea>' +
    ' <button class="connect-btn" onclick="submitAd()">Pay 200 KES & Post Job</button>' +
    ' <p id="adMsg" style="margin-top:10px; font-size:14px;"></p>' +
    ' </div>' +
    ' <h2>Direct Employer Posts</h2>' +
    ' <div id="userAds" class="loading">Loading...</div>' +
    ' </div>' +
    ' </div>' +
    '</div>' +
    ' <script>' +
    'function openMenu(){document.getElementById("sideMenu").style.left="0";document.getElementById("overlay").style.display="block";document.getElementById("sideMenu").setAttribute("aria-hidden","false");}' +
    'function closeMenu(){document.getElementById("sideMenu").style.left="-320px";document.getElementById("overlay").style.display="none";document.getElementById("sideMenu").setAttribute("aria-hidden","true");}' +
    'function toggleAuth(){const s=document.getElementById("signupForm"),l=document.getElementById("loginForm"),t=document.getElementById("authTitle");if(s.style.display==="none"){s.style.display="block";l.style.display="none";t.textContent="Worker Registration";}else{s.style.display="none";l.style.display="block";t.textContent="Worker Login";}}' +
    'function showMainContent(user){document.getElementById("authModal").style.display="none";document.getElementById("mainContent").style.display="block";document.getElementById("userInfo").textContent="Welcome "+user.first_name+"!";loadSponsoredAds();loadJobs();loadUserAds();}' +
    'async function signup(){const first=document.getElementById("firstName").value.trim(),last=document.getElementById("lastName").value.trim(),email=document.getElementById("signupEmail").value.trim(),phone=document.getElementById("signupPhone").value.trim(),pass=document.getElementById("signupPassword").value,cpass=document.getElementById("confirmPassword").value;const msg=document.getElementById("signupMsg");if(!first||!last||!email||!pass||!phone){msg.textContent="Fill all fields";msg.style.color="red";return;}if(pass!==cpass){msg.textContent="Passwords do not match";msg.style.color="red";return;}msg.textContent="Registering...";msg.style.color="blue";const res=await fetch("/auth/signup",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({firstName:first,lastName:last,email,phone,password:pass})});const data=await res.json();if(data.success){localStorage.setItem("jobai_user",JSON.stringify(data.user));showMainContent(data.user);}else{msg.textContent=data.error||"Signup failed";msg.style.color="red";}}' +
    'async function login(){const email=document.getElementById("loginEmail").value.trim(),pass=document.getElementById("loginPassword").value;const msg=document.getElementById("loginMsg");if(!email||!pass){msg.textContent="Enter email and password";msg.style.color="red";return;}msg.textContent="Logging in...";msg.style.color="blue";const res=await fetch("/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password:pass})});const data=await res.json();if(data.success){localStorage.setItem("jobai_user",JSON.stringify(data.user));showMainContent(data.user);}else{msg.textContent=data.error||"Login failed";msg.style.color="red";}}' +
    'async function logout(){await fetch("/auth/logout",{method:"POST"});localStorage.removeItem("jobai_user");location.reload();}' +
    'window.addEventListener("load",()=>{const user=JSON.parse(localStorage.getItem("jobai_user")||"null");if(user){showMainContent(user);}else{document.getElementById("authModal").style.display="flex";document.getElementById("mainContent").style.display="none";}});' +
    'document.getElementById("menuBtn").addEventListener("click",openMenu);' +
    ' let allJobs = [];' +
    ' function timeAgo(dateStr) {' +
    ' if (!dateStr) return "";' +
    ' const date = new Date(dateStr);' +
    ' if (isNaN(date.getTime())) return "";' +
    ' const now = new Date();' +
    ' const diffMs = now - date;' +
    ' const diffDay = Math.floor(diffMs / (1000*60*60*24));' +
    ' if (diffDay > 2) return "";' +
    ' if (diffMs < 0) return "";' +
    ' const diffSec = Math.floor(diffMs/1000);' +
    ' const diffMin = Math.floor(diffSec/60);' +
    ' const diffHr = Math.floor(diffMin/60);' +
    ' if (diffSec < 60) return "just now";' +
    ' if (diffMin < 60) return diffMin + "m ago";' +
    ' if (diffHr < 24) return diffHr + "h ago";' +
    ' if (diffDay === 1) return "1d ago";' +
    ' return diffDay + "d ago";' +
    ' }' +
    ' function renderJobs(jobs) {' +
    ' if (!jobs.length) {' +
    ' document.getElementById("jobs").innerHTML = "<div class=\\"error\\">No jobs found. Try \'canada\' or \'nurse\'</div>";' +
    ' return;' +
    ' }' +
    ' document.getElementById("jobs").innerHTML = jobs.map(function(j) {' +
    ' const timeStr = timeAgo(j.date_posted);' +
    ' const timePart = timeStr? `<span>•</span><span>${timeStr}</span>` : "";' +
    ' const tagClass = j.source === "Direct Partner"? "direct-tag" : "";' +
    ' let buttons = "<div class=\\"btn-group\\">";' +
    ' if (j.phone) {' +
    ' buttons += "<a href=\\"https://wa.me/" + j.phone.replace(/[^0-9]/g,"") + "\\" target=\\"_blank\\" class=\\"connect-btn call-btn\\">WhatsApp Employer</a>";' +
    ' }' +
    ' if (j.url && j.url!== "#") {' +
    ' buttons += "<a href=\\"" + j.url + "\\" target=\\"_blank\\" class=\\"connect-btn\\">Apply on Website</a>";' +
    ' }' +
    ' buttons += "</div>";' +
    ' return "<div class=\\"job-card\\"><span class=\\"country-tag\\">" + j.country + "</span><span class=\\"source-tag " + tagClass + "\\">" + j.source + "</span><h3>" + j.title + "</h3><p class=\\"job-meta\\"><span>" + j.location + "</span><span>•</span><span>" + j.company + "</span>" + timePart + "</p>" + buttons + "</div>";' +
    ' }).join("");' +
    ' }' +
    ' function renderSponsoredAds(ads) {' +
    ' if (!ads.length) {' +
    ' document.getElementById("sponsoredAds").innerHTML = "<div class=\\"error\\">No sponsored jobs right now.</div>";' +
    ' return;' +
    ' }' +
    ' document.getElementById("sponsoredAds").innerHTML = ads.map(function(j) {' +
    ' let buttons = "<div class=\\"btn-group\\">";' +
    ' if (j.phone) {' +
    ' buttons += "<a href=\\"https://wa.me/" + j.phone.replace(/[^0-9]/g,"") + "\\" target=\\"_blank\\" class=\\"connect-btn call-btn\\">WhatsApp Now</a>";' +
    ' }' +
    ' if (j.url && j.url!== "#") {' +
    ' buttons += "<a href=\\"" + j.url + "\\" target=\\"_blank\\" class=\\"connect-btn\\">Apply Now</a>";' +
    ' }' +
    ' buttons += "</div>";' +
    ' const timeStr = timeAgo(j.created_at);' +
    ' const timeHtml = timeStr? `<span class="source-tag">${timeStr}</span>` : "";' +
    ' return "<div class=\\"job-card sponsored-card\\" style=\\"position:relative\\"><span class=\\"country-tag sponsored-tag\\">SPONSORED</span>"+timeHtml+"<h3>" + j.title + "</h3><p class=\\"job-meta\\"><span>" + j.location + "</span><span>•</span><span>" + j.company + "</span></p><p>" + (j.description || "") + "</p><p class=\\"phone-display\\">" + (j.phone? "WhatsApp: " + j.phone : "") + "</p>" + buttons + "</div>";' +
    ' }).join("");' +
    ' }' +
    ' function renderUserAds(ads) {' +
    ' if (!ads.length) {' +
    ' document.getElementById("userAds").innerHTML = "<div class=\\"error\\">No employer posts yet.</div>";' +
    ' return;' +
    ' }' +
    ' document.getElementById("userAds").innerHTML = ads.map(function(j) {' +
    ' let buttons = "<div class=\\"btn-group\\">";' +
    ' if (j.url && j.url!== "#") {' +
    ' buttons += "<a href=\\"" + j.url + "\\" target=\\"_blank\\" class=\\"connect-btn\\">Company Website</a>";' +
    ' }' +
    ' if (j.phone) {' +
    ' buttons += "<a href=\\"https://wa.me/" + j.phone.replace(/[^0-9]/g,"") + "\\" target=\\"_blank\\" class=\\"connect-btn call-btn\\">WhatsApp " + j.phone + "</a>";' +
    ' }' +
    ' buttons += "</div>";' +
    ' const timeStr = timeAgo(j.created_at);' +
    ' const timeHtml = timeStr? `<span class="source-tag">${timeStr}</span>` : "";' +
    ' return "<div class=\\"job-card\\" style=\\"position:relative\\"><span class=\\"country-tag user-ad-tag\\">Direct Hire</span>"+timeHtml+"<h3>" + j.title + "</h3><p class=\\"job-meta\\"><span>" + j.location + "</span><span>•</span><span>" + j.company + "</span></p><p>" + (j.description || "") + "</p><p class=\\"phone-display\\">" + (j.phone? "WhatsApp: " + j.phone : "") + "</p>" + buttons + "</div>";' +
    ' }).join("");' +
    ' }' +
    ' async function loadJobs() {' +
    ' const query = document.getElementById("searchInput").value || "dubai OR abu dhabi OR riyadh OR doha OR toronto OR london OR helper OR cleaner OR driver OR security OR nurse OR caregiver OR construction OR warehouse";' +
    ' const days = document.getElementById("dateFilter").value;' +
    ' document.getElementById("jobs").innerHTML = "<div class=\\"loading\\">Loading verified global jobs...</div>";' +
    ' try {' +
    ' const res = await fetch("/jobs?query=" + encodeURIComponent(query) + "&recent=" + days);' +
    ' allJobs = await res.json();' +
    ' renderJobs(allJobs);' +
    ' } catch (e) {' +
    ' document.getElementById("jobs").innerHTML = "<div class=\\"error\\">Failed to load jobs. Refresh page.</div>";' +
    ' }' +
    ' }' +
    ' async function loadSponsoredAds() {' +
    ' const res = await fetch("/sponsored");' +
    ' const ads = await res.json();' +
    ' renderSponsoredAds(ads);' +
    ' }' +
    ' async function loadUserAds() {' +
    ' const res = await fetch("/ads");' +
    ' const ads = await res.json();' +
    ' renderUserAds(ads);' +
    ' }' +
    ' async function submitAd() {' +
    ' const data = {' +
    ' title: document.getElementById("adTitle").value,' +
    ' company: document.getElementById("adCompany").value,' +
    ' location: document.getElementById("adLocation").value,' +
    ' phone: document.getElementById("adPhone").value,' +
    ' url: document.getElementById("adUrl").value,' +
    ' description: document.getElementById("adDesc").value' +
    ' };' +
    ' if (!data.title ||!data.company ||!data.location ||!data.phone) {' +
        ' document.getElementById("adMsg").textContent = "Fill title, company, location, WhatsApp.";' +
    ' document.getElementById("adMsg").style.color = "red";' +
    ' return;' +
    ' }' +
    ' document.getElementById("adMsg").textContent = "Redirecting to payment...";' +
    ' document.getElementById("adMsg").style.color = "blue";' +
    ' const res = await fetch("/ads/initiate-payment", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(data)});' +
    ' const result = await res.json();' +
    ' if (result.payment_link) {' +
    ' window.location.href = result.payment_link;' +
    ' } else {' +
    ' document.getElementById("adMsg").textContent = "Payment failed. Try again.";' +
    ' document.getElementById("adMsg").style.color = "red";' +
    ' }' +
    ' }' +
    ' const urlParams = new URLSearchParams(window.location.search);' +
    ' if (urlParams.get("payment") === "success") {' +
    ' document.getElementById("adMsg").textContent = "Payment successful! Job posted.";' +
    ' document.getElementById("adMsg").style.color = "green";' +
    ' }' +
    ' if (urlParams.get("payment") === "failed") {' +
    ' document.getElementById("adMsg").textContent = "Payment failed or cancelled.";' +
    ' document.getElementById("adMsg").style.color = "red";' +
    ' }' +
    ' document.getElementById("searchBtn").addEventListener("click", loadJobs);' +
    ' document.getElementById("dateFilter").addEventListener("change", loadJobs);' +
    ' document.getElementById("searchInput").addEventListener("keypress", function(e) {' +
    ' if (e.key === "Enter") loadJobs();' +
    ' });' +
    ' </script>' +
    ' </body>' +
    ' </html>'
  );
});

// AUTH ROUTES
app.post('/auth/signup', async (req, res) => {
  const { firstName, lastName, email, phone, password } = req.body;
  if (!firstName ||!lastName ||!email ||!password ||!phone) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (first_name, last_name, email, phone, password_hash) VALUES ($1, $2, $3, $4, $5) RETURNING id, first_name, last_name, email, phone`,
      [firstName, lastName, email, phone, hash]
    );
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      res.status(400).json({ success: false, error: 'Email already registered' });
    } else {
      console.error(err);
      res.status(500).json({ success: false, error: 'Registration failed' });
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
    res.json({ success: true, user: { id: user.id, first_name: user.first_name, last_name: user.last_name, email: user.email, phone: user.phone } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

app.post('/auth/logout', (req, res) => {
  res.json({ success: true });
});

// SPONSORED ADS ROUTE - YOUR FEATURED JOBS
app.get('/sponsored', async (req, res) => {
  try {
    const dbSponsored = await pool.query(`SELECT * FROM ads WHERE sponsored = true AND status = 'approved' ORDER BY created_at DESC`);
    const allSponsored = [...SPONSORED_ADS,...dbSponsored.rows];
    res.json(allSponsored);
  } catch (err) {
    res.json(SPONSORED_ADS);
  }
});

// FETCHERS - ADZUNA + JSEARCH - FIXED TO SHOW MORE JOBS
async function fetchAdzunaJobs(countryCode, countryName, query) {
  try {
    const url = `https://api.adzuna.com/v1/api/jobs/${countryCode}/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_API_KEY}&results_per_page=50&content-type=application/json&what=${encodeURIComponent(query)}&sort_by=date`;
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Adzuna ${countryCode} failed:`, response.status);
      return [];
    }
    const data = await response.json();
    console.log(`Adzuna ${countryCode} found:`, data.count || 0);
    return (data.results || []).map(j => ({
      title: j.title || 'Job Opening',
      company: j.company?.display_name || 'Employer',
      location: j.location?.display_name || countryName,
      country: countryName,
      url: j.redirect_url || '#',
      date_posted: j.created,
      source: 'Adzuna',
      phone: ''
    }));
  } catch (err) {
    console.error(`Adzuna ${countryCode} error:`, err.message);
    return [];
  }
}

async function fetchJSearchJobs(query, location) {
  try {
    const url = `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}&num_pages=3`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
      }
    });
    if (!response.ok) {
      console.error(`JSearch ${location} failed:`, response.status);
      return [];
    }
    const data = await response.json();
    console.log(`JSearch ${location} found:`, data.data?.length || 0);
    return (data.data || []).map(j => ({
      title: j.job_title || 'Job Opening',
      company: j.employer_name || 'Employer',
      location: j.job_city || location,
      country: location,
      url: j.job_apply_link || '#',
      date_posted: j.job_posted_at_datetime_utc,
      source: j.job_publisher || 'JSearch',
      phone: ''
    }));
  } catch (err) {
    console.error(`JSearch ${location} error:`, err.message);
    return [];
  }
}

// JOBS ROUTE - COMBINES ADZUNA + JSEARCH + DIRECT EMPLOYERS + PAID POSTS
app.get('/jobs', async (req, res) => {
  try {
    const query = req.query.query || 'dubai OR abu dhabi OR riyadh OR doha OR toronto OR london OR helper OR cleaner OR driver OR security OR nurse OR caregiver OR construction OR warehouse';
    const recentDays = parseInt(req.query.recent) || 30;

    const countries = [
      { code: 'ae', name: 'United Arab Emirates' },
      { code: 'sa', name: 'Saudi Arabia' },
      { code: 'qa', name: 'Qatar' },
      { code: 'kw', name: 'Kuwait' },
      { code: 'om', name: 'Oman' },
      { code: 'bh', name: 'Bahrain' },
      { code: 'ca', name: 'Canada' },
      { code: 'gb', name: 'United Kingdom' }
    ];

    let allJobs = [];

    const promises = [];
    for (let i = 0; i < countries.length; i++) {
      promises.push(fetchAdzunaJobs(countries[i].code, countries[i].name, query));
      promises.push(fetchJSearchJobs(query, countries[i].name));
    }

    const results = await Promise.allSettled(promises);
    results.forEach(r => {
      if (r.status === 'fulfilled' && r.value) {
        allJobs.push(...r.value);
      }
    });

    allJobs.push(...DIRECT_EMPLOYERS);

    try {
      const dbAds = await pool.query(`SELECT * FROM ads WHERE type = 'job' AND status = 'approved' AND sponsored = false ORDER BY created_at DESC LIMIT 20`);
      const employerJobs = dbAds.rows.map(j => ({
        title: j.title,
        company: j.company,
        location: j.location,
        country: 'Global',
        url: j.url || '#',
        phone: j.phone,
        date_posted: j.created_at,
        source: 'Employer Direct',
        description: j.description
      }));
      allJobs.push(...employerJobs);
    } catch (dbErr) {
      console.error('DB jobs error:', dbErr);
    }

    allJobs = allJobs.filter((job, index, self) =>
      index === self.findIndex(j => j.url === job.url && j.title === job.title)
    );

    if (recentDays > 0 && req.query.recent!== 'all') {
      const cutoff = Date.now() - recentDays * 24 * 60 * 60 * 1000;
      allJobs = allJobs.filter(j => j.date_posted && new Date(j.date_posted).getTime() > cutoff);
    }

    allJobs.sort((a, b) => new Date(b.date_posted) - new Date(a.date_posted));

    res.json(allJobs.slice(0, 100));
  } catch (err) {
    console.error('Jobs fetch error:', err);
    res.json(DIRECT_EMPLOYERS);
  }
});

// EMPLOYER ADS ROUTES
app.get('/ads', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM ads WHERE type = 'job' AND status = 'approved' AND sponsored = false ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// PAYMENT FOR EMPLOYER JOB POSTS - 200 KES
app.post('/ads/initiate-payment', async (req, res) => {
  const { title, company, location, phone, url, description } = req.body;
  if (!title ||!company ||!location ||!phone) {
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
        customer: { email: 'employer@emmieTech.com', phonenumber: phone, name: company },
        customizations: { title: 'Global Job Post', description: 'Pay 200 KES to hire Ugandan workers' }
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

// PAYMENT CALLBACK
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
        await pool.query(
          `INSERT INTO ads (id, token, type, status, title, company, location, phone, url, description, paymentref, sponsored, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())`,
          [id, jobData.token, 'job', 'approved', jobData.title, jobData.company, jobData.location, jobData.phone, jobData.url, jobData.description, transaction_id, false]
        );
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

app.listen(PORT, function() {
  console.log('EmmieTech Global Recruitment Server running on port ' + PORT);
});
