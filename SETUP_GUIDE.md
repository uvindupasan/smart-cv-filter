# ============================================================
# SMART CV FILTER SYSTEM — COMPLETE SETUP GUIDE
# Step-by-Step Instructions for H A U P Kumarsinghe | KIU
# ============================================================

## PREREQUISITES — Install These First

### 1. Node.js (for Backend + Frontend)
   Download: https://nodejs.org  (choose LTS version)
   Verify:   node --version  (should show v18 or higher)

### 2. Python 3.10+ (for AI Service)
   Download: https://python.org/downloads
   Verify:   python --version

### 3. MongoDB (Database)
   Download: https://www.mongodb.com/try/download/community
   Start:    mongod  (or start via MongoDB Compass)
   Verify:   mongo --version

### 4. Git (optional but recommended)
   Download: https://git-scm.com

---

## STEP 1 — SET UP THE BACKEND

   cd smart-cv-filter/backend

### 1a. Install Node packages
   npm install

### 1b. Create your .env file
   Copy .env.example to .env:
     cp .env.example .env

   Open .env and set:
     MONGO_URI=mongodb://localhost:27017/smart_cv_filter
     JWT_SECRET=any_long_random_string_you_choose_abc123
     FRONTEND_URL=http://localhost:3000

### 1c. Start the backend
   npm run dev

   ✅ You should see:
      ✅ MongoDB connected
      🚀 Backend running on http://localhost:5000

---

## STEP 2 — SET UP THE AI SERVICE (Sentence-BERT)

   cd smart-cv-filter/ai-service

### 2a. Create Python virtual environment (recommended)
   python -m venv venv

   Activate it:
   - Windows:  venv\Scripts\activate
   - Mac/Linux: source venv/bin/activate

### 2b. Install Python packages
   pip install -r requirements.txt

   ⚠️  NOTE: This will download the SBERT model (~100MB) on first run.
   It only downloads once, then gets cached locally.

### 2c. Start the AI service
   python main.py

   ✅ You should see:
      ⏳ Loading Sentence-BERT model...
      ✅ Model 'all-MiniLM-L6-v2' loaded successfully
      INFO:     Uvicorn running on http://0.0.0.0:8000

   You can test it by opening: http://localhost:8000/docs
   (FastAPI auto-generates interactive API documentation!)

---

## STEP 3 — SET UP THE FRONTEND

   cd smart-cv-filter/frontend

### 3a. Install React packages
   npm install

### 3b. Create .env file (optional — only if your backend port is different)
   Create a file called .env in the frontend folder:
     REACT_APP_API_URL=http://localhost:5000/api

### 3c. Start the frontend
   npm start

   ✅ Browser will open at: http://localhost:3000

---

## STEP 4 — TRAIN & EVALUATE THE AI MODEL (For Research Section 7.4)

   cd smart-cv-filter/ai-service

### 4a. Run the training/evaluation script
   python training/train_model.py

   This will:
   - Load 20 sample CVs
   - Generate SBERT embeddings for all CVs
   - Run 6 test search queries
   - Compare SBERT vs Keyword matching
   - Print Precision@10, Recall@10, F1, MAP scores
   - Save results to data/evaluation_results.json

   ✅ Example output:
      Query                               Method     P@10    R@10    F1      AP
      ------------------------------------------------------------------------
      machine learning engineer           SBERT      0.300   0.750   0.429   0.688
                                          Keyword    0.100   0.250   0.143   0.167

      ========================================================================
      📈 SUMMARY — Average Metrics Across All Queries
      ========================================================================
      Metric               SBERT          Keyword        Improvement
      Precision@10         0.280          0.110          +154.5%
      Recall@10            0.733          0.333          +120.1%
      F1 Score             0.393          0.158          +148.7%
      MAP                  0.621          0.189          +228.6%

   USE THESE NUMBERS IN YOUR THESIS SECTION 7.4!

---

## STEP 5 — USING THE SYSTEM

### As HR Admin:
   1. Open http://localhost:3000
   2. Register → creates your admin account
   3. Login
   4. Click "New Campaign" → fill in job details
   5. Copy the generated apply link (e.g. http://localhost:3000/apply/abc123)
   6. Share the link with candidates

### As Candidate:
   1. Open the apply link HR shared
   2. Read job details
   3. Fill in the form (name, gender, address, email, institute, skills, why hire)
   4. Submit → get confirmation message

### Back as HR Admin:
   1. Open Dashboard → see your campaigns + application count
   2. Click a campaign → see all submitted CVs
   3. Use the Search Bar → type "Python", "English", "machine learning"
   4. CVs are ranked by AI relevance score (%)
   5. Click "View / Download" on any CV → see full details
   6. Click "Download PDF" → saves as PDF

---

## PROJECT FOLDER STRUCTURE

smart-cv-filter/
├── backend/
│   ├── server.js          ← Main Express server
│   ├── .env               ← Your config (create from .env.example)
│   ├── package.json
│   ├── routes/
│   │   ├── auth.js        ← Login / Register
│   │   ├── campaigns.js   ← Campaign CRUD + public slug route
│   │   └── cvs.js         ← CV submit, search, view, download
│   ├── models/
│   │   ├── User.js        ← HR admin accounts
│   │   ├── Campaign.js    ← Job campaigns
│   │   └── CV.js          ← Candidate applications
│   └── middleware/
│       └── auth.js        ← JWT token verification
│
├── ai-service/
│   ├── main.py            ← FastAPI + SBERT server
│   ├── requirements.txt   ← Python dependencies
│   └── training/
│       └── train_model.py ← Research evaluation script
│
└── frontend/
    ├── package.json
    └── src/
        ├── App.jsx               ← Routes
        ├── utils/api.js          ← All API calls
        ├── pages/
        │   ├── Login.jsx         ← HR login/register
        │   ├── Dashboard.jsx     ← Main dashboard + global search
        │   ├── CampaignCreate.jsx ← Create job campaign
        │   ├── CampaignView.jsx  ← View campaign + CVs + search
        │   └── Apply.jsx         ← Public candidate form
        └── components/
            ├── CVCard.jsx        ← CV summary card
            └── CVModal.jsx       ← Full CV view + PDF download

---

## API ENDPOINTS REFERENCE

### Backend (http://localhost:5000/api)

  Auth:
    POST /auth/register    → Register HR admin
    POST /auth/login       → Login, get JWT token
    GET  /auth/me          → Get logged-in user info

  Campaigns (protected):
    GET    /campaigns           → List all campaigns
    POST   /campaigns           → Create campaign
    GET    /campaigns/:id       → Get campaign + its CVs
    PUT    /campaigns/:id       → Update campaign
    DELETE /campaigns/:id       → Deactivate campaign
    GET    /campaigns/public/:slug → Public: get campaign by slug

  CVs:
    POST /cvs/submit/:slug      → Public: candidate submits CV
    GET  /cvs/search?query=...  → AI semantic search
    GET  /cvs/:id               → Get one CV (protected)
    PUT  /cvs/:id/status        → Update CV status (protected)

### AI Service (http://localhost:8000)

    POST /embed          → Generate SBERT embedding for text
    POST /search         → Semantic search: rank CVs by query
    POST /search/keyword → Keyword baseline search
    POST /compare        → Compare SBERT vs keyword (for research)
    GET  /docs           → Auto-generated API documentation

---

## COMMON ERRORS & FIXES

  ❌ "MongoDB connection failed"
     → Make sure MongoDB is running: mongod
     → Check MONGO_URI in .env

  ❌ "Cannot find module 'sentence-transformers'"
     → Run: pip install sentence-transformers
     → Make sure your virtual environment is activated

  ❌ "AI search returns 0 results"
     → CVs need embeddings. They're generated after submission.
     → Wait a few seconds after submitting a CV, then search.

  ❌ "CORS error" in browser
     → Check FRONTEND_URL in backend .env matches your React URL
     → Restart the backend after changing .env

  ❌ "Token expired"
     → Log out and log back in

---

## DEPLOYMENT (When Your Project is Ready)

  Frontend → Vercel (free): https://vercel.com
  Backend  → Render (free): https://render.com
  AI Service → Railway or Render with Python
  Database → MongoDB Atlas (free 512MB): https://cloud.mongodb.com

---

Good luck with your KIU research project! 🎓
H A U P Kumarsinghe | 11174 | 2026
