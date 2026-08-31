# Smart CV Filter
### AI-Powered Recruitment Platform with Semantic CV Search

> **KIU Final Year Research Project 2026**
> **Researcher:** H A U P Kumarsinghe | Reg. No. 11174
> **Supervisor:** *(your supervisor's name)*

---

## Overview

Smart CV Filter is a full-stack AI-powered recruitment platform that allows HR administrators to create job campaigns, receive candidate applications, and search through CVs using **Sentence-BERT semantic language matching** — going beyond simple keyword filtering.

The system compares two retrieval approaches:
- **SBERT** (Sentence-BERT / `all-MiniLM-L6-v2`) — semantic embedding search
- **TF-IDF** — traditional keyword baseline

---

## System Architecture

```
┌─────────────────────┐     HTTP      ┌────────────────────┐
│  React Frontend     │ ◄──────────► │  Node.js Backend   │
│  (Port 3000)        │               │  (Express, Port 5000)│
└─────────────────────┘               └─────────┬──────────┘
                                                 │
                                          ┌──────▼──────┐
                                          │  MongoDB     │
                                          │  (Port 27017)│
                                          └─────────────┘
                                                 │
                                          ┌──────▼──────┐
                                          │ Python AI    │
                                          │ FastAPI      │
                                          │ (Port 8000)  │
                                          └─────────────┘
```

---

## Features

### HR Admin Panel
- 🔒 Secure registration and login (JWT + bcrypt)
- 📋 Create, view, edit, and deactivate job campaigns
- 🔗 Auto-generated unique public apply links
- 👥 View all candidate applications per campaign with Grid and List layout toggles
- ✏️ Track candidate ATS pipeline status (Applied → Shortlisted → Interview → Selected → Rejected)
- � Recruiter CRM features: Internal notes feed and 1–5 star candidate fit ratings
- �📄 View and download uploaded CV PDFs
- 🗜️ Bulk download all CVs as a ZIP file
- 🔍 AI-powered semantic CV search across all or specific job campaigns
- 👥 **Complete Employee Database & Workforce Management**:
  - Employee ID, Profile image, Full name, Gender, DOB, Personal & Company emails, Phone, Address, Emergency contacts
  - Department, Designation, Employment type (Permanent, Probation, Internship, Contract, Part-time), Joining & Probation dates
  - Employee Status (Active, Inactive, Resigned, Terminated), Manager/Supervisor, Work location, Hybrid/Remote mode
  - Salary compensation details, Bank account details, Skills & Tech stack, Education & Experience history
  - Live Search, 5-Criteria Multi-Filter (Department, Designation, Type, Status, Dates), Sorting & Grid/Table layout toggles
- 🏢 **Department & Designation Management**:
  - Organizational structure setup with Department Codes (e.g., DEV, QA, BA, UIUX, PMO, HR, FIN, ADM) and Department Heads
  - Designation Title tracking with Job Levels (Junior, Mid-Level, Senior, Lead, Executive)
  - Full CRUD operations with Active/Inactive status toggle
- 🕒 **Attendance Management System**:
  - Live Punch In / Punch Out interactive widget with real-time system clock
  - Automatic calculation of total working hours in decimal format
  - Attendance Statuses: Present, Late (auto-flagged past 09:00 AM cutoff), Absent, Half Day, On Leave, Work From Home
  - Work Mode tracking: On-site, Hybrid, Remote
  - HR Manager View: Multi-filtering by Date, Employee, Department, Status with authorized manual record overrides
  - Monthly Attendance Summary Report generator with printable/exportable table
- 🏖️ **Leave Management System**:
  - Leave Types: Annual Leave, Casual Leave, Sick Leave, No-pay Leave, Half Day, Other
  - Employee Portal: Interactive Leave Application form with auto-calculated duration days and optional document upload (e.g. Medical Certificate PDF/Img)
  - Leave Entitlement Widgets: Live tracking of remaining vs used balances (Annual: 14, Casual: 7, Sick: 7, Unpaid)
  - Workflow: Pending ➔ Approved / Rejected with HR comments & remarks
  - Automation: Automatic working day duration calculation and instant deduction from staff leave balances upon approval
  - HR Configuration: Custom yearly leave entitlement default allocation for the company
- 🚀 **Employee Onboarding Management System**:
  - Manual Onboarding Initiation by HR for newly joined team members
  - Standardized 9-Step Default Checklist covering Documentation, IT Setup, HR System Access, and Department Orientation
  - Real-time Progress Tracking: Visual percentage completion bar (e.g. 67% Complete • 6/9 Tasks)
  - Interactive Checklist Modal with task category tabs, completed timestamp, assignee logging, and task notes
  - Custom Onboarding Task addition capability for department-specific requirements
- 📁 **Confidential Employee Document Management Vault**:
  - Multi-category Repository: CV, NIC / Passport, Educational certificates, Employment contracts, Offer letters, Medical certificates, Service letters, Warning letters, Performance documents, and Other HR documents
  - Secure File Storage & Streaming: JWT role-protected document endpoints preventing unauthorized public URL access
  - Filter & Search: Real-time filtering by category, employee ID/name, or search query
  - Interactive Actions: PDF / image preview in browser, secure binary file download, and document record deletion

### Candidate Application Form (Public)
- No account required
- Complete application: personal info, education, skills, personal statement
- Optional PDF CV upload (max 5MB)
- Clean, professional UI on any device

### AI Search Engine
- Sentence-BERT (`all-MiniLM-L6-v2`) generates 384-dimensional embeddings
- Cosine similarity ranking of candidates vs. search query
- TF-IDF keyword baseline for research comparison
- Results ranked by semantic relevance score

### Research Evaluation
- Precision@10, Recall@10, F1 Score, MAP
- Search time comparison (SBERT vs TF-IDF)
- Automated CSV export of evaluation results

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Tailwind CSS, Axios |
| Backend  | Node.js, Express 4, Mongoose, JWT, Multer, Archiver |
| Database | MongoDB (Mongoose ODM) |
| AI Service | Python 3.10, FastAPI, Uvicorn |
| AI Model | sentence-transformers/all-MiniLM-L6-v2 (pretrained) |
| Evaluation | scikit-learn, NumPy, pytest |
| Testing  | Jest 29, Supertest, pytest |

---

## Project Structure

```
smart-cv-filter/
├── backend/                  # Node.js Express API
│   ├── models/               # Mongoose schemas (User, Campaign, CV)
│   ├── routes/               # API route handlers
│   ├── middleware/           # JWT auth middleware
│   ├── uploads/              # Uploaded PDF files (gitignored)
│   ├── tests/                # Jest unit + integration tests
│   │   ├── unit.test.js
│   │   └── integration.test.js
│   └── server.js
│
├── frontend/                 # React application
│   └── src/
│       ├── pages/            # Login, Dashboard, CampaignCreate/View/Edit, Apply
│       ├── components/       # CVCard, CVModal
│       └── utils/api.js      # Axios API helpers
│
├── ai-service/               # Python FastAPI AI microservice
│   ├── main.py               # SBERT embedding + search endpoints
│   ├── models/               # Local SBERT model folder (gitignored)
│   ├── training/
│   │   └── evaluate.py       # SBERT vs TF-IDF evaluation
│   └── tests/
│       └── test_ai.py        # pytest unit tests
│
├── UAT_Template.md           # User acceptance testing template
├── SETUP_GUIDE.md            # Detailed setup instructions
├── .gitignore
└── README.md
```

---

## Quick Start

### Prerequisites
- Node.js ≥ 16
- Python 3.9–3.11
- MongoDB (running on port 27017)

### 1. Clone & Navigate
```bash
cd smart-cv-filter
```

### 2. Backend Setup
```bash
cd backend
npm install
# Create .env file (see Environment Variables section)
npm run dev
```

### 3. AI Service Setup
```bash
cd ai-service
pip install -r requirements.txt
python main.py
```

### 4. Frontend Setup
```bash
cd frontend
npm install
npm start
```

### 5. Open Browser
```
http://localhost:3000
```
Register as an HR Admin → Create a campaign → Share the apply link with candidates.

---

## Environment Variables

Create `backend/.env`:
```env
MONGO_URI=mongodb://localhost:27017/smart_cv_filter
JWT_SECRET=your_strong_secret_key_here
JWT_EXPIRES_IN=7d
PORT=5000
FRONTEND_URL=http://localhost:3000
AI_SERVICE_URL=http://localhost:8000
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | ❌ | Register HR admin |
| POST | /api/auth/login | ❌ | Login HR admin |
| GET  | /api/auth/me | ✅ | Get current user |

### Campaigns
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET  | /api/campaigns | ✅ | List all campaigns |
| POST | /api/campaigns | ✅ | Create campaign |
| GET  | /api/campaigns/public/:slug | ❌ | Public campaign info |
| GET  | /api/campaigns/:id | ✅ | Campaign + CVs |
| PUT  | /api/campaigns/:id | ✅ | Update campaign |
| DELETE | /api/campaigns/:id | ✅ | Deactivate campaign |
| GET  | /api/campaigns/:id/download-zip | ✅ | Bulk ZIP download |

### CVs
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/cvs/submit/:slug | ❌ | Candidate application |
| GET  | /api/cvs/search?query=... | ✅ | AI semantic search |
| GET  | /api/cvs/:id | ✅ | CV details |
| PUT  | /api/cvs/:id/status | ✅ | Update CV status |
| GET  | /api/cvs/:id/file | ✅ | Stream uploaded PDF |

### AI Service (FastAPI — Port 8000)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | / | Health check |
| POST | /embed | Generate SBERT embedding |
| POST | /search | Semantic search (cosine similarity) |
| POST | /search/keyword | TF-IDF keyword baseline |
| POST | /compare | SBERT vs TF-IDF comparison |

---

## Running Tests

### Backend Unit Tests (Jest)
```bash
cd backend
npm test
# Expected: 25 tests passed
```

### Python AI Unit Tests (pytest)
```bash
cd ai-service
python -m pytest tests/test_ai.py -v
# Tests: model loading, embedding dims, cosine similarity, metric calculations
```

### Research Evaluation
```bash
cd ai-service
python training/evaluate.py
# Output: data/evaluation_results.csv + data/evaluation_summary.txt
```

---

## Research Evaluation Results

| Metric | SBERT | TF-IDF |
|--------|-------|--------|
| Precision@10 | 0.265 | 0.260 |
| Recall@10 | 0.940 | 0.945 |
| F1 Score | 0.359 | 0.354 |
| MAP | 0.888 | 0.910 |
| Avg Search Time | ~19ms | ~2ms |

*Results based on 20 test queries with 20 sample CVs and human-labeled ground truth.*

---

## AI Model

The system uses **`sentence-transformers/all-MiniLM-L6-v2`** — a lightweight, pretrained Sentence-BERT model that produces 384-dimensional semantic embeddings.

- **Training**: The model is **pretrained** on a large corpus. No custom training is performed.
- **Source**: [HuggingFace](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2)
- **Local loading**: Model is stored in `ai-service/models/` for offline use.

---

## License

This project is developed as a final year research project at Kotelawala Intelligence University (KIU) and is not licensed for commercial use.

---

*Smart CV Filter | AI-Powered Recruitment Platform | KIU Research Project 2026*
