# AutoReach 🚀
> **Autonomous Multimodal Cold Outreach & Application Tracking System for Job Seekers**

AutoReach solves the manual, exhausting, and error-prone process of sending customized cold emails for internships. Instead of manually editing recipient names, roles, and company details 50 times a day, AutoReach takes a **screenshot or raw text** of a hiring tweet / LinkedIn post, uses **Multimodal Vision AI (Gemini 2.5 Flash)** to extract recipient metadata, matches the role with your best stored projects, crafts a high-converting cold email, and allows 1-click dispatch via your personal Gmail with your uploaded resume PDF attached.

---

## ⚡ Core Features (Version 1.0 MVP)

- **🖼️ Multimodal Screenshot & Text Extraction:** Drag-and-drop a screenshot of a tweet, LinkedIn announcement, or Discord post. Gemini 2.5 Flash automatically extracts `companyName`, `recipientName`, `recipientEmail`, and `role`.
- **🎯 Dynamic Project Matcher:** AutoReach checks your stored projects library and selects the 1–2 most relevant projects based on the target role's tech stack.
- **👁️ Human-in-the-Loop Review:** Never blindly auto-send. Review and edit the drafted subject, body, and extracted metadata in an intuitive preview before sending.
- **📎 Resume PDF Dispatcher:** Automatically attaches your uploaded `resume.pdf` and dispatches the email through your real `@gmail.com` account using SMTP.
- **📊 Real-time Application Pipeline Tracker:**
  - Full company-applied list with search and status filters (`Sent`, `Replied`, `Interview`, `Soft Rejection`).
  - Pipeline metrics: Total applications, awaiting replies, response rate %.
  - "View Email" history to review what you sent prior to an interview.
- **💾 Zero-Config SQLite + Prisma Database:** Everything persists locally in a clean, portable SQLite database.

---

## 🏗️ Architecture

```
[ Screenshot / Pasted Text ]
              │
              ▼
[ Google Gemini 2.5 Flash Multimodal Engine ]
              │
              ├── Recruiter Name, Company, Role, Email
              └── Match Candidate Projects & Draft Pitch
              │
              ▼
[ React 19 + Tailwind Dashboard (Preview & Edit) ]
              │
         (1-Click Send)
              │
              ▼
[ Node.js + Express Backend ]
              │
      ┌───────┴───────┐
      ▼               ▼
[ Nodemailer ]   [ Prisma ORM ]
 (Gmail SMTP)      (dev.db SQLite)
      │               │
  Outbound        Track Status:
 Email + Resume    SENT / REPLIED
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18+)
- A free **Google Gemini API Key** (from [Google AI Studio](https://aistudio.google.com/app/apikey))
- A **Gmail App Password** (from your [Google Security Account](https://myaccount.google.com/security))

### 2. Running Locally
The application is already initialized! To run both servers:

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
# Running on http://localhost:5000
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
# Running on http://localhost:3000
```

### 3. First-Time Setup in the App (1 Minute)
1. Open **`http://localhost:3000`** in your browser.
2. Go to **Settings**:
   - Paste your **Gemini API Key**.
   - Enter your **Gmail address** and **16-character App Password**.
   - Click **Save & Verify Connection**.
3. Go to **Profile & Resume**:
   - Fill in your name, contact details, and college.
   - Upload your active **Resume PDF**.
   - Add 2–3 projects with tech tags (e.g. `React, Node.js`, `Python, FastAPI`).
4. Go to **New Outreach**:
   - Drop a screenshot of any hiring post or paste text $\rightarrow$ Click **Generate Tailored Outreach**!

---

## 🎓 Resume & College Minor Project Pitch

When presenting or interviewing about this project:
- **Title:** *AutoReach: An Autonomous Multimodal Cold Outreach and Pipeline Tracking System*
- **Key Technical Highlights:**
  - Engineered multimodal document extraction using Google's Gemini Vision API with structured JSON schemas.
  - Built a relational tracking pipeline using TypeScript, Express, and Prisma ORM with SQLite.
  - Integrated transactional SMTP email dispatch with automated MIME attachment pipelines.
  - Implemented responsive state management in React with Tailwind CSS.

---

## 🗺️ Roadmap (Upcoming Versions)

- **Version 2.0 (Queuing & Anti-Spam):**
  - Integrate **BullMQ + Redis** for jittered dispatch delays (60-90s between emails) to protect Gmail sender reputation.
  - 5-Day Automated Follow-up Reminder / Generator.
- **Version 3.0 (Automated Reply Tracking):**
  - Connect **Gmail API History / Google Pub/Sub Webhooks** to automatically flag recruiter replies and schedule interviews without manual status updates.
