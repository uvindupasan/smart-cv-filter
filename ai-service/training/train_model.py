# ============================================================
# Smart CV Filter — AI Model Training & Evaluation Script
# ============================================================
# This script is for your RESEARCH SECTION (Section 7.4):
#   1. Loads sample CV dataset
#   2. Generates SBERT embeddings for all CVs
#   3. Runs evaluation: SBERT vs Keyword matching
#   4. Calculates Precision@10, Recall@10, F1, MAP
#   5. Prints comparison table for your thesis
#
# HOW TO RUN:
#   cd ai-service
#   python training/train_model.py
# ============================================================

import json
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from pathlib import Path

# ── Load Model ───────────────────────────────────────────────
print("⏳ Loading SBERT model (this may take a few minutes first time)...")
model = SentenceTransformer("all-MiniLM-L6-v2")
print("✅ Model loaded!")

# ── Sample Dataset ───────────────────────────────────────────
# In your real project, this data comes from MongoDB
# For training/testing, we use 20 sample CVs
SAMPLE_CVS = [
    {"id": "cv_001", "name": "Kasun Perera",    "skills": "Python, machine learning, TensorFlow, deep learning, data analysis, neural networks"},
    {"id": "cv_002", "name": "Nimali Fernando", "skills": "Java, Spring Boot, REST API, SQL, backend development, microservices"},
    {"id": "cv_003", "name": "Dilan Silva",     "skills": "React, JavaScript, TypeScript, CSS, frontend development, HTML5"},
    {"id": "cv_004", "name": "Sachini Jayawardena", "skills": "data science, pandas, numpy, statistics, Python, Jupyter, visualization"},
    {"id": "cv_005", "name": "Ravindu Bandara", "skills": "Node.js, Express, MongoDB, REST API, JavaScript, backend engineering"},
    {"id": "cv_006", "name": "Malsha Wijesinghe", "skills": "UI/UX design, Figma, wireframing, Adobe XD, user research, prototyping"},
    {"id": "cv_007", "name": "Chanaka Dissanayake", "skills": "AWS, Docker, Kubernetes, DevOps, CI/CD, cloud infrastructure"},
    {"id": "cv_008", "name": "Thisara Gunasekara", "skills": "Android development, Kotlin, Java, mobile apps, Firebase, REST API"},
    {"id": "cv_009", "name": "Samanthi Rathnayake", "skills": "artificial intelligence, natural language processing, Python, BERT, text classification"},
    {"id": "cv_010", "name": "Lahiru Madusanka",  "skills": "React Native, mobile development, JavaScript, iOS, Android, Expo"},
    {"id": "cv_011", "name": "Kavindra Perera",   "skills": "PHP, Laravel, MySQL, web development, JavaScript, Bootstrap"},
    {"id": "cv_012", "name": "Nimesha Jayasuriya","skills": "data engineering, Spark, Hadoop, ETL pipelines, SQL, data warehouse"},
    {"id": "cv_013", "name": "Isuru Wickramasinghe","skills": "cybersecurity, ethical hacking, penetration testing, network security, OWASP"},
    {"id": "cv_014", "name": "Dilini Senanayake", "skills": "project management, Agile, Scrum, Jira, team leadership, communication"},
    {"id": "cv_015", "name": "Chathura Weerasinghe","skills": "computer vision, OpenCV, image processing, Python, deep learning, YOLO"},
    {"id": "cv_016", "name": "Sumudu Karunathilake","skills": "Flutter, Dart, mobile apps, cross-platform, Firebase, state management"},
    {"id": "cv_017", "name": "Akila Jayaweera",   "skills": "software testing, QA automation, Selenium, pytest, test cases, CI/CD"},
    {"id": "cv_018", "name": "Dinusha Samarasinghe","skills": "Python, data analytics, Excel, Power BI, Tableau, business intelligence"},
    {"id": "cv_019", "name": "Pasan Herath",      "skills": "blockchain, Solidity, smart contracts, Ethereum, Web3, cryptocurrency"},
    {"id": "cv_020", "name": "Iresha Seneviratne", "skills": "SQL, database administration, PostgreSQL, MySQL, query optimization, indexing"},
]

# ── Test Queries with Ground Truth ───────────────────────────
# Format: query → list of CV IDs that are truly relevant
# (In your real research, a human expert creates this ground truth)
TEST_QUERIES = [
    {
        "query": "machine learning engineer",
        "relevant": ["cv_001", "cv_004", "cv_009", "cv_015"]
    },
    {
        "query": "Python developer",
        "relevant": ["cv_001", "cv_004", "cv_005", "cv_009", "cv_015", "cv_018"]
    },
    {
        "query": "backend developer",
        "relevant": ["cv_002", "cv_005", "cv_008", "cv_011"]
    },
    {
        "query": "mobile application developer",
        "relevant": ["cv_008", "cv_010", "cv_016"]
    },
    {
        "query": "data analyst",
        "relevant": ["cv_004", "cv_012", "cv_018"]
    },
    {
        "query": "artificial intelligence",
        "relevant": ["cv_001", "cv_004", "cv_009", "cv_015"]
    },
]


# ── Step 1: Generate SBERT Embeddings ────────────────────────
def generate_embeddings(cvs):
    print("\n📊 Step 1: Generating SBERT embeddings...")
    texts = [cv["skills"] for cv in cvs]
    embeddings = model.encode(texts, convert_to_numpy=True, show_progress_bar=True)
    print(f"   Generated {len(embeddings)} embeddings, shape: {embeddings.shape}")
    return embeddings

# ── Step 2: SBERT Semantic Search ────────────────────────────
def sbert_search(query, cv_ids, embeddings, top_k=10):
    query_emb = model.encode(query, convert_to_numpy=True).reshape(1, -1)
    similarities = cosine_similarity(query_emb, embeddings)[0]
    sorted_indices = np.argsort(similarities)[::-1][:top_k]
    return [cv_ids[i] for i in sorted_indices], [float(similarities[i]) for i in sorted_indices]

# ── Step 3: Keyword Search (baseline) ────────────────────────
def keyword_search(query, cv_ids, skills_texts, top_k=10):
    query_words = set(query.lower().split())
    scores = []
    for text in skills_texts:
        text_words = set(text.lower().split())
        matches = len(query_words.intersection(text_words))
        score = matches / len(query_words) if query_words else 0
        scores.append(score)
    scores_array = np.array(scores)
    sorted_indices = np.argsort(scores_array)[::-1][:top_k]
    return [cv_ids[i] for i in sorted_indices], [float(scores_array[i]) for i in sorted_indices]

# ── Step 4: Evaluation Metrics ───────────────────────────────
def precision_at_k(retrieved, relevant, k=10):
    retrieved_k = retrieved[:k]
    hits = sum(1 for r in retrieved_k if r in relevant)
    return hits / k

def recall_at_k(retrieved, relevant, k=10):
    retrieved_k = retrieved[:k]
    hits = sum(1 for r in retrieved_k if r in relevant)
    return hits / len(relevant) if relevant else 0

def f1_score(precision, recall):
    if precision + recall == 0:
        return 0
    return 2 * (precision * recall) / (precision + recall)

def average_precision(retrieved, relevant):
    hits = 0
    sum_precisions = 0
    for i, doc_id in enumerate(retrieved):
        if doc_id in relevant:
            hits += 1
            sum_precisions += hits / (i + 1)
    return sum_precisions / len(relevant) if relevant else 0


# ── Step 5: Run Full Evaluation ───────────────────────────────
def run_evaluation():
    cv_ids = [cv["id"] for cv in SAMPLE_CVS]
    skills_texts = [cv["skills"] for cv in SAMPLE_CVS]

    # Generate embeddings once
    embeddings = generate_embeddings(SAMPLE_CVS)

    print("\n📊 Step 2: Running evaluation on test queries...\n")

    sbert_metrics_all   = []
    keyword_metrics_all = []

    print(f"{'Query':<35} {'Method':<10} {'P@10':<8} {'R@10':<8} {'F1':<8} {'AP':<8}")
    print("-" * 80)

    for test in TEST_QUERIES:
        query   = test["query"]
        relevant = set(test["relevant"])

        # SBERT search
        sbert_ids, sbert_scores = sbert_search(query, cv_ids, embeddings)
        sp = precision_at_k(sbert_ids, relevant)
        sr = recall_at_k(sbert_ids, relevant)
        sf = f1_score(sp, sr)
        sa = average_precision(sbert_ids, relevant)
        sbert_metrics_all.append({"p": sp, "r": sr, "f1": sf, "ap": sa})

        # Keyword search
        kw_ids, kw_scores = keyword_search(query, cv_ids, skills_texts)
        kp = precision_at_k(kw_ids, relevant)
        kr = recall_at_k(kw_ids, relevant)
        kf = f1_score(kp, kr)
        ka = average_precision(kw_ids, relevant)
        keyword_metrics_all.append({"p": kp, "r": kr, "f1": kf, "ap": ka})

        # Print row
        q_short = query[:34]
        print(f"{q_short:<35} {'SBERT':<10} {sp:.3f}    {sr:.3f}    {sf:.3f}    {sa:.3f}")
        print(f"{'':35} {'Keyword':<10} {kp:.3f}    {kr:.3f}    {kf:.3f}    {ka:.3f}")
        print()

    # ── Summary ──────────────────────────────────────────────
    def avg(lst, key): return sum(d[key] for d in lst) / len(lst)

    print("\n" + "=" * 80)
    print("📈 SUMMARY — Average Metrics Across All Queries")
    print("=" * 80)
    print(f"{'Metric':<20} {'SBERT':<15} {'Keyword':<15} {'Improvement'}")
    print("-" * 60)

    for key, label in [("p", "Precision@10"), ("r", "Recall@10"), ("f1", "F1 Score"), ("ap", "MAP")]:
        sbert_val   = avg(sbert_metrics_all, key)
        keyword_val = avg(keyword_metrics_all, key)
        improvement = ((sbert_val - keyword_val) / keyword_val * 100) if keyword_val > 0 else 0
        print(f"{label:<20} {sbert_val:.3f}          {keyword_val:.3f}          +{improvement:.1f}%")

    print("\n✅ Evaluation complete! Use these results in your thesis Section 7.4")
    print("💾 Saving results to data/evaluation_results.json...")

    results = {
        "sbert_avg":   {k: avg(sbert_metrics_all, k) for k in ["p", "r", "f1", "ap"]},
        "keyword_avg": {k: avg(keyword_metrics_all, k) for k in ["p", "r", "f1", "ap"]},
        "model": "all-MiniLM-L6-v2",
        "n_cvs": len(SAMPLE_CVS),
        "n_queries": len(TEST_QUERIES)
    }

    Path("../data").mkdir(exist_ok=True)
    with open("../data/evaluation_results.json", "w") as f:
        json.dump(results, f, indent=2)
    print("✅ Saved!")


if __name__ == "__main__":
    print("=" * 60)
    print("  Smart CV Filter — AI Training & Evaluation")
    print("  KIU Research Project | 2026")
    print("=" * 60)
    run_evaluation()
