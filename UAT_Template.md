# Smart CV Filter System — User Acceptance Testing (UAT)
## KIU Research Project | H A U P Kumarsinghe | 11174

---

> **Instructions for Evaluators**
> - Do NOT share answers with other participants before completing your own test.
> - Rate honestly — this data is used for research purposes.
> - Contact the researcher if you encounter any technical issues.

---

## SECTION A — HR ADMIN TESTING (5 HR Professionals / HR Students)

**Evaluator Name:** ___________________________
**Role / Designation:** ___________________________
**Date of Testing:** ___________________________
**System URL:** http://localhost:3000

---

### A1. HR Registration & Login

| # | Test Action | Expected Result | Pass / Fail | Notes |
|---|-------------|-----------------|-------------|-------|
| 1 | Open http://localhost:3000 | Login page loads | | |
| 2 | Click "Register here" | Registration form appears | | |
| 3 | Register with name, email, password | Account created successfully | | |
| 4 | Login with registered credentials | Dashboard loads | | |
| 5 | Click "Logout" | Returns to login page | | |
| 6 | Try to access / without login | Redirected to login page | | |

---

### A2. Campaign Creation

| # | Test Action | Expected Result | Pass / Fail | Notes |
|---|-------------|-----------------|-------------|-------|
| 7  | Click "+ New Campaign" | Campaign creation form opens | | |
| 8  | Fill all required fields and submit | Campaign created successfully | | |
| 9  | View the generated Apply Link | A unique URL is displayed | | |
| 10 | Copy the Apply Link | Link copied to clipboard | | |
| 11 | Leave required field empty and submit | Validation error shown | | |

---

### A3. Campaign Viewing & Management

| # | Test Action | Expected Result | Pass / Fail | Notes |
|---|-------------|-----------------|-------------|-------|
| 12 | View Dashboard | Campaigns listed with application counts | | |
| 13 | Click a campaign card | Campaign detail page opens | | |
| 14 | Click "Edit" on campaign | Edit form loads with existing data | | |
| 15 | Change a field and save | Campaign updated successfully | | |
| 16 | Uncheck "Campaign is Active" and save | Campaign marked as Closed | | |

---

### A4. AI-Powered CV Search

| # | Test Action | Expected Result | Pass / Fail | Notes |
|---|-------------|-----------------|-------------|-------|
| 17 | Type "Python developer" in search bar | Relevant CVs appear ranked | | |
| 18 | Search "English fluent" | CVs with English skill appear | | |
| 19 | Search "machine learning" | ML-related CVs appear | | |
| 20 | Search "customer service" | Service-oriented CVs appear | | |
| 21 | Click "Clear" button | Search results removed | | |
| 22 | Search within a specific campaign | Only that campaign's CVs shown | | |

---

### A5. Candidate Viewing & Status

| # | Test Action | Expected Result | Pass / Fail | Notes |
|---|-------------|-----------------|-------------|-------|
| 23 | Click "View / Download" on a candidate card | Candidate details modal opens | | |
| 24 | Check all fields are visible (name, email, skills, etc.) | All data displayed correctly | | |
| 25 | Change status dropdown to "Shortlisted" | Status updates immediately | | |
| 26 | Change status to "Rejected" | Status updates correctly | | |
| 27 | View semantic relevance score (search result) | Score shown as percentage | | |

---

### A6. PDF Download

| # | Test Action | Expected Result | Pass / Fail | Notes |
|---|-------------|-----------------|-------------|-------|
| 28 | Click "Download Application PDF" | PDF generated and downloaded | | |
| 29 | If candidate uploaded CV: click "View Uploaded CV" | Uploaded PDF opens | | |
| 30 | Click "Download All CVs (ZIP)" on campaign | ZIP file with all uploaded CVs downloaded | | |

---

### A7. Overall HR Experience Rating

Please rate each aspect (1 = Very Poor, 5 = Excellent):

| Aspect | Rating (1–5) | Comments |
|--------|-------------|---------|
| Ease of login / registration | | |
| Campaign creation ease | | |
| AI search accuracy | | |
| Candidate detail clarity | | |
| PDF download reliability | | |
| Overall usability | | |
| System speed / responsiveness | | |

**Overall Rating: _____ / 5**

**Would you recommend this system to an HR department?** ☐ Yes ☐ No ☐ Maybe

**What did you like most?**
___________________________________________

**What could be improved?**
___________________________________________

---

---

## SECTION B — CANDIDATE TESTING (10 Users / Students)

**Participant Name:** ___________________________
**Age Range:** ☐ 18–22 ☐ 23–27 ☐ 28–35 ☐ 36+
**Date of Testing:** ___________________________
**Apply Link Given:** ___________________________

---

### B1. Accessing the Application Form

| # | Test Action | Expected Result | Pass / Fail | Notes |
|---|-------------|-----------------|-------------|-------|
| 1 | Open the Apply Link in browser | Application form loads correctly | | |
| 2 | Read the Job Details section | Job description is clear | | |
| 3 | Expand "View Job Details" | Details expand smoothly | | |

---

### B2. Filling & Submitting the Form

| # | Test Action | Expected Result | Pass / Fail | Notes |
|---|-------------|-----------------|-------------|-------|
| 4  | Fill Full Name | Field accepts input | | |
| 5  | Select Gender from dropdown | Gender selected | | |
| 6  | Fill Email Address | Field validates email format | | |
| 7  | Type invalid email | Validation error shown | | |
| 8  | Fill all required fields | No errors shown | | |
| 9  | Enter skills (comma separated) | Skills field accepts input | | |
| 10 | Upload a PDF CV file | File selected, name shown | | |
| 11 | Try to upload a .docx file | Error: "Only PDF files allowed" | | |
| 12 | Click Submit without required fields | Validation error shown | | |
| 13 | Submit complete form | Success message appears | | |

---

### B3. Overall Candidate Experience Rating

Please rate each aspect (1 = Very Poor, 5 = Excellent):

| Aspect | Rating (1–5) | Comments |
|--------|-------------|---------|
| Page loading speed | | |
| Form clarity and labels | | |
| Ease of filling the form | | |
| File upload experience | | |
| Success message after submit | | |
| Overall experience | | |

**Overall Rating: _____ / 5**

**Was the form easy to complete?** ☐ Very Easy ☐ Easy ☐ Neutral ☐ Difficult ☐ Very Difficult

**Did you encounter any issues?**
___________________________________________

**Suggestions for improvement:**
___________________________________________

---

---

## SECTION C — UAT SUMMARY (Researcher fills this section)

### HR Admin Testing Summary (5 evaluators)

| Evaluator | Overall Rating | Pass Rate | Key Issues |
|-----------|---------------|-----------|------------|
| HR-01 | /5 | /30 | |
| HR-02 | /5 | /30 | |
| HR-03 | /5 | /30 | |
| HR-04 | /5 | /30 | |
| HR-05 | /5 | /30 | |
| **Average** | **/5** | **/30** | |

### Candidate Testing Summary (10 participants)

| Participant | Overall Rating | Pass Rate | Key Issues |
|-------------|---------------|-----------|------------|
| C-01 | /5 | /13 | |
| C-02 | /5 | /13 | |
| C-03 | /5 | /13 | |
| C-04 | /5 | /13 | |
| C-05 | /5 | /13 | |
| C-06 | /5 | /13 | |
| C-07 | /5 | /13 | |
| C-08 | /5 | /13 | |
| C-09 | /5 | /13 | |
| C-10 | /5 | /13 | |
| **Average** | **/5** | **/13** | |

### UAT Conclusion

**Total test cases:** 43 (30 HR + 13 Candidate)
**Acceptance Criteria:** ≥ 80% pass rate AND average rating ≥ 3.5/5

☐ ACCEPTED — System meets UAT requirements
☐ REJECTED — Issues require resolution before acceptance

**Date UAT Completed:** ___________________________
**Researcher Signature:** ___________________________

---

*Smart CV Filter System | KIU Research Project 2026*
*H A U P Kumarsinghe | Registration No. 11174*
