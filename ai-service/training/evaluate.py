"""
============================================================
Smart CV Filter — AI Search Evaluation Script
Research Evaluation: SBERT vs TF-IDF Baseline
============================================================
Author : H A U P Kumarsinghe | KIU | 11174
Purpose: Evaluate Sentence-BERT semantic search against
         TF-IDF keyword baseline using:
           - Precision@10
           - Recall@10
           - F1 Score
           - Mean Average Precision (MAP)
           - Search Time (ms)

Usage:
  python training/evaluate.py

Output:
  data/evaluation_results.csv   — Per-query metrics
  data/evaluation_summary.txt   — Average summary table
============================================================
"""

import os
import sys
import json
import time
import csv
import math
from pathlib import Path

# ── Add parent directory to path so we can import modules ──
sys.path.insert(0, str(Path(__file__).parent.parent))

os.environ['HF_HUB_DOWNLOAD_TIMEOUT'] = '120'

# ── Load SBERT Model ────────────────────────────────────────
LOCAL_MODEL = str(Path(__file__).parent.parent / "models" / "all-MiniLM-L6-v2")
FINETUNED_MODEL = str(Path(__file__).parent.parent / "models" / "fine-tuned-cv-model")
print("Loading Sentence-BERT model...")

try:
    from sentence_transformers import SentenceTransformer
    import numpy as np
    from sklearn.metrics.pairwise import cosine_similarity
    from sklearn.feature_extraction.text import TfidfVectorizer

    if os.path.exists(FINETUNED_MODEL):
        model = SentenceTransformer(FINETUNED_MODEL)
        print("[OK] Fine-tuned CV model loaded successfully.")
    elif os.path.exists(LOCAL_MODEL):
        model = SentenceTransformer(LOCAL_MODEL)
        print("[OK] Model loaded from local folder.")
    else:
        model = SentenceTransformer("all-MiniLM-L6-v2")
        print("[OK] Model loaded from HuggingFace.")
except ImportError as e:
    print(f"[ERROR] Missing package: {e}")
    print("Run: pip install sentence-transformers scikit-learn numpy")
    sys.exit(1)


# ============================================================
# SECTION 1: SAMPLE CV DATA (20 CVs for quick demo)
# For full evaluation, load from your MongoDB or JSON file.
# Replace this with 100+ real CVs for the final research.
# ============================================================

SAMPLE_CVS = [
    {"id": "CV001", "name": "Ashan Perera",      "text": "Python, Machine Learning, TensorFlow, Deep Learning, Data Analysis, English. BSc Computer Science."},
    {"id": "CV002", "name": "Nimasha Fernando",  "text": "React, JavaScript, Node.js, HTML, CSS, English, Sinhala. BSc Software Engineering."},
    {"id": "CV003", "name": "Kasun Bandara",     "text": "Java, Spring Boot, MySQL, REST API, English. BSc Information Technology."},
    {"id": "CV004", "name": "Tharindi Silva",    "text": "Python, Data Science, Pandas, NumPy, Machine Learning, English, Japanese. BSc Statistics."},
    {"id": "CV005", "name": "Lahiru Jayawardena","text": "React, Vue.js, JavaScript, TypeScript, CSS, Frontend, English. BSc Software Engineering."},
    {"id": "CV006", "name": "Sachini Kumari",    "text": "HR Management, Communication, English, Sinhala, Tamil, Recruitment, Office Management."},
    {"id": "CV007", "name": "Dinesh Rathnayake", "text": "Python, Keras, NLP, Natural Language Processing, BERT, English. MSc AI."},
    {"id": "CV008", "name": "Imesha Thilakarathne","text": "Customer Service, Communication, English, Problem Solving, Sales, CRM."},
    {"id": "CV009", "name": "Roshan Wijesinghe", "text": "Project Management, Agile, Scrum, Leadership, Communication, English, PMP Certified."},
    {"id": "CV010", "name": "Hiruni Perera",     "text": "Accounting, Finance, Excel, SAP, English, Sinhala. BCom Finance."},
    {"id": "CV011", "name": "Malith Gunasekara", "text": "Python, Flask, Django, PostgreSQL, Docker, REST API, English."},
    {"id": "CV012", "name": "Sanduni Fernando",  "text": "Japanese, English, Translation, Communication, Cultural Studies, Japanese Language N2."},
    {"id": "CV013", "name": "Chaminda Abeysekara","text": "DevOps, AWS, Docker, Kubernetes, CI/CD, Linux, English. BSc Computer Science."},
    {"id": "CV014", "name": "Nadeesha Jayasinghe","text": "Marketing, Social Media, English, Content Writing, SEO, Digital Marketing."},
    {"id": "CV015", "name": "Pradeep Herath",    "text": "React Native, Flutter, Mobile Development, JavaScript, Dart, English."},
    {"id": "CV016", "name": "Gayathri Munasinghe","text": "French, English, Translation, International Relations, Communication, French B2."},
    {"id": "CV017", "name": "Nuwan Senevirathne","text": "SQL, Database Administration, MySQL, Oracle, Data Modeling, English."},
    {"id": "CV018", "name": "Thilini Dissanayake","text": "Machine Learning, Python, Scikit-learn, Random Forest, Feature Engineering, English."},
    {"id": "CV019", "name": "Vimukthi Perera",   "text": "Communication, Customer Relations, English, Sinhala, Tamil, Office Administration."},
    {"id": "CV020", "name": "Asanka Jayakody",   "text": "Python, Backend Development, FastAPI, MongoDB, Redis, Microservices, English."},
]


# ============================================================
# SECTION 2: GROUND TRUTH (Human-labeled relevance judgments)
# For each query, list CV IDs that are GENUINELY RELEVANT.
# A human evaluator (HR professional) should review and label.
# This example uses research-appropriate judgments.
# ============================================================

QUERIES = [
    {
        "query": "Python developer",
        "relevant": ["CV001", "CV004", "CV007", "CV011", "CV018", "CV020"]
    },
    {
        "query": "React frontend developer",
        "relevant": ["CV002", "CV005", "CV015"]
    },
    {
        "query": "machine learning engineer",
        "relevant": ["CV001", "CV004", "CV007", "CV018"]
    },
    {
        "query": "English fluent",
        "relevant": ["CV001","CV002","CV003","CV004","CV005","CV006","CV007","CV008",
                     "CV009","CV010","CV011","CV012","CV013","CV014","CV015","CV016",
                     "CV017","CV018","CV019","CV020"]
    },
    {
        "query": "Japanese language",
        "relevant": ["CV004", "CV012"]
    },
    {
        "query": "French language",
        "relevant": ["CV016"]
    },
    {
        "query": "customer service communication",
        "relevant": ["CV006", "CV008", "CV019"]
    },
    {
        "query": "project management agile",
        "relevant": ["CV009"]
    },
    {
        "query": "backend developer API",
        "relevant": ["CV003", "CV011", "CV020"]
    },
    {
        "query": "data science statistics",
        "relevant": ["CV001", "CV004", "CV007", "CV017", "CV018"]
    },
    {
        "query": "DevOps cloud infrastructure",
        "relevant": ["CV013"]
    },
    {
        "query": "mobile app developer",
        "relevant": ["CV015"]
    },
    {
        "query": "HR human resources recruitment",
        "relevant": ["CV006"]
    },
    {
        "query": "digital marketing content writing",
        "relevant": ["CV014"]
    },
    {
        "query": "Sinhala Tamil multilingual",
        "relevant": ["CV006", "CV010", "CV019"]
    },
    {
        "query": "database SQL administrator",
        "relevant": ["CV003", "CV017"]
    },
    {
        "query": "natural language processing NLP",
        "relevant": ["CV007"]
    },
    {
        "query": "accounting finance",
        "relevant": ["CV010"]
    },
    {
        "query": "Docker Kubernetes containerization",
        "relevant": ["CV013"]
    },
    {
        "query": "software engineer full stack",
        "relevant": ["CV002", "CV003", "CV005", "CV011", "CV020"]
    },
]


# ============================================================
# SECTION 3: EVALUATION FUNCTIONS
# ============================================================

def precision_at_k(retrieved, relevant, k=10):
    """Precision@K: relevant results in top-K / K"""
    top_k = retrieved[:k]
    hits  = sum(1 for r in top_k if r in relevant)
    return hits / k if k > 0 else 0.0


def recall_at_k(retrieved, relevant, k=10):
    """Recall@K: relevant results in top-K / total relevant"""
    if not relevant:
        return 0.0
    top_k = retrieved[:k]
    hits  = sum(1 for r in top_k if r in relevant)
    return hits / len(relevant)


def f1_score(p, r):
    """F1 = 2 * P * R / (P + R)"""
    return (2 * p * r / (p + r)) if (p + r) > 0 else 0.0


def average_precision(retrieved, relevant, k=10):
    """Average Precision (AP) for one query"""
    if not relevant:
        return 0.0
    hits   = 0
    ap_sum = 0.0
    for i, doc in enumerate(retrieved[:k], start=1):
        if doc in relevant:
            hits   += 1
            ap_sum += hits / i
    return ap_sum / len(relevant)


# ============================================================
# SECTION 4: SBERT SEARCH
# ============================================================

# Pre-compute all CV embeddings once
print("\nPre-computing SBERT embeddings for all CVs...")
cv_texts = [cv["text"] for cv in SAMPLE_CVS]
cv_ids   = [cv["id"]   for cv in SAMPLE_CVS]

t0 = time.time()
cv_embeddings = model.encode(cv_texts, convert_to_numpy=True)
embed_time = time.time() - t0
print(f"[OK] {len(SAMPLE_CVS)} CV embeddings computed in {embed_time:.2f}s")


def sbert_search(query_text):
    """Returns CV IDs ranked by cosine similarity to query."""
    t_start = time.time()
    q_emb   = model.encode(query_text, convert_to_numpy=True).reshape(1, -1)
    sims    = cosine_similarity(q_emb, cv_embeddings)[0]
    ranked  = sorted(range(len(cv_ids)), key=lambda i: sims[i], reverse=True)
    elapsed = (time.time() - t_start) * 1000  # ms
    return [cv_ids[i] for i in ranked], elapsed


# ============================================================
# SECTION 5: TF-IDF BASELINE SEARCH
# ============================================================

tfidf_vectorizer = TfidfVectorizer(lowercase=True, stop_words='english')
tfidf_matrix     = tfidf_vectorizer.fit_transform(cv_texts)


def tfidf_search(query_text):
    """Returns CV IDs ranked by TF-IDF cosine similarity."""
    t_start = time.time()
    q_vec   = tfidf_vectorizer.transform([query_text])
    sims    = cosine_similarity(q_vec, tfidf_matrix)[0]
    ranked  = sorted(range(len(cv_ids)), key=lambda i: sims[i], reverse=True)
    elapsed = (time.time() - t_start) * 1000  # ms
    return [cv_ids[i] for i in ranked], elapsed


# ============================================================
# SECTION 6: RUN EVALUATION
# ============================================================

results = []
K = 10

print(f"\nRunning evaluation on {len(QUERIES)} queries (K={K})...")
print("=" * 100)
print(f"{'Query':<35} {'Method':<8} {'P@10':>6} {'R@10':>6} {'F1':>6} {'AP':>6} {'Time(ms)':>9}")
print("-" * 100)

for q in QUERIES:
    query   = q["query"]
    relevant = set(q["relevant"])

    # SBERT
    sbert_ranked, sbert_time = sbert_search(query)
    sp = precision_at_k(sbert_ranked, relevant, K)
    sr = recall_at_k(sbert_ranked, relevant, K)
    sf = f1_score(sp, sr)
    sa = average_precision(sbert_ranked, relevant, K)

    # TF-IDF
    tfidf_ranked, tfidf_time = tfidf_search(query)
    tp = precision_at_k(tfidf_ranked, relevant, K)
    tr = recall_at_k(tfidf_ranked, relevant, K)
    tf_f = f1_score(tp, tr)
    ta = average_precision(tfidf_ranked, relevant, K)

    results.append({
        "query":            query,
        "SBERT_P10":        round(sp, 4),
        "SBERT_R10":        round(sr, 4),
        "SBERT_F1":         round(sf, 4),
        "SBERT_AP":         round(sa, 4),
        "SBERT_Time_ms":    round(sbert_time, 2),
        "TFIDF_P10":        round(tp, 4),
        "TFIDF_R10":        round(tr, 4),
        "TFIDF_F1":         round(tf_f, 4),
        "TFIDF_AP":         round(ta, 4),
        "TFIDF_Time_ms":    round(tfidf_time, 2),
    })

    trunc_q = query[:33]
    print(f"{trunc_q:<35} {'SBERT':<8} {sp:>6.3f} {sr:>6.3f} {sf:>6.3f} {sa:>6.3f} {sbert_time:>9.1f}")
    print(f"{'':35} {'TF-IDF':<8} {tp:>6.3f} {tr:>6.3f} {tf_f:>6.3f} {ta:>6.3f} {tfidf_time:>9.1f}")
    print()


# ============================================================
# SECTION 7: SUMMARY
# ============================================================

n = len(results)
avg = {
    "SBERT_P10":     sum(r["SBERT_P10"]  for r in results) / n,
    "SBERT_R10":     sum(r["SBERT_R10"]  for r in results) / n,
    "SBERT_F1":      sum(r["SBERT_F1"]   for r in results) / n,
    "SBERT_MAP":     sum(r["SBERT_AP"]   for r in results) / n,
    "SBERT_AvgTime": sum(r["SBERT_Time_ms"] for r in results) / n,
    "TFIDF_P10":     sum(r["TFIDF_P10"]  for r in results) / n,
    "TFIDF_R10":     sum(r["TFIDF_R10"]  for r in results) / n,
    "TFIDF_F1":      sum(r["TFIDF_F1"]   for r in results) / n,
    "TFIDF_MAP":     sum(r["TFIDF_AP"]   for r in results) / n,
    "TFIDF_AvgTime": sum(r["TFIDF_Time_ms"] for r in results) / n,
}

print("=" * 80)
print("SUMMARY -- Average Metrics Across All Queries")
print("=" * 80)
print(f"{'Metric':<25} {'SBERT':>10} {'TF-IDF':>10} {'Improvement':>14}")
print("-" * 60)

metrics = [
    ("Precision@10",      "SBERT_P10",  "TFIDF_P10"),
    ("Recall@10",         "SBERT_R10",  "TFIDF_R10"),
    ("F1 Score",          "SBERT_F1",   "TFIDF_F1"),
    ("MAP",               "SBERT_MAP",  "TFIDF_MAP"),
    ("Avg Search (ms)",   "SBERT_AvgTime", "TFIDF_AvgTime"),
]

for label, sk, tk in metrics:
    sv = avg[sk]
    tv = avg[tk]
    if tv > 0:
        imp = f"+{((sv - tv) / tv * 100):.1f}%"
    else:
        imp = "N/A"
    print(f"{label:<25} {sv:>10.4f} {tv:>10.4f} {imp:>14}")

print("=" * 80)


# ============================================================
# SECTION 8: EXPORT TO CSV
# ============================================================

data_dir = Path(__file__).parent.parent / "data"
data_dir.mkdir(exist_ok=True)

csv_path = data_dir / "evaluation_results.csv"
with open(csv_path, "w", newline="", encoding="utf-8") as f:
    fieldnames = [
        "query",
        "SBERT_P10", "SBERT_R10", "SBERT_F1", "SBERT_AP", "SBERT_Time_ms",
        "TFIDF_P10", "TFIDF_R10", "TFIDF_F1", "TFIDF_AP", "TFIDF_Time_ms",
    ]
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(results)

    # Append averages row
    avg_row = {
        "query":          "AVERAGE",
        "SBERT_P10":      round(avg["SBERT_P10"],     4),
        "SBERT_R10":      round(avg["SBERT_R10"],     4),
        "SBERT_F1":       round(avg["SBERT_F1"],      4),
        "SBERT_AP":       round(avg["SBERT_MAP"],     4),
        "SBERT_Time_ms":  round(avg["SBERT_AvgTime"], 2),
        "TFIDF_P10":      round(avg["TFIDF_P10"],     4),
        "TFIDF_R10":      round(avg["TFIDF_R10"],     4),
        "TFIDF_F1":       round(avg["TFIDF_F1"],      4),
        "TFIDF_AP":       round(avg["TFIDF_MAP"],     4),
        "TFIDF_Time_ms":  round(avg["TFIDF_AvgTime"], 2),
    }
    writer.writerow(avg_row)

print(f"\n[OK] Evaluation results saved to: {csv_path}")

# Summary text
summary_path = data_dir / "evaluation_summary.txt"
with open(summary_path, "w", encoding="utf-8") as f:
    f.write("Smart CV Filter - AI Search Evaluation Summary\n")
    f.write("KIU Research Project | H A U P Kumarsinghe | 11174\n")
    f.write("=" * 60 + "\n\n")
    f.write(f"Number of Queries   : {n}\n")
    f.write(f"Number of CVs       : {len(SAMPLE_CVS)}\n")
    f.write(f"Model               : Sentence-BERT (all-MiniLM-L6-v2)\n")
    f.write(f"Baseline            : TF-IDF cosine similarity\n\n")
    f.write(f"{'Metric':<20} {'SBERT':>8} {'TF-IDF':>8} {'Improvement':>12}\n")
    f.write("-" * 50 + "\n")
    for label, sk, tk in metrics:
        sv = avg[sk]; tv = avg[tk]
        imp = f"+{((sv-tv)/tv*100):.1f}%" if tv > 0 else "N/A"
        f.write(f"{label:<20} {sv:>8.4f} {tv:>8.4f} {imp:>12}\n")

print(f"[OK] Summary saved to:  {summary_path}")
print("\n[DONE] Evaluation complete!")
print("\nIMPORTANT: This evaluation used sample data.")
print("For your final research, replace SAMPLE_CVS with real")
print("candidate records and have an HR professional label QUERIES.")
