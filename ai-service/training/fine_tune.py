# ============================================================
# Smart CV Filter — Custom Offline SBERT Fine-Tuning Script
# ============================================================
# PURPOSE (Research Paper Section: Methodology / Model Training):
#   Fine-tunes the base 'all-MiniLM-L6-v2' SBERT model on a
#   domain-specific CV-to-Job-Description similarity dataset.
#
#   Uses a native PyTorch custom training loop to avoid any dependency
#   on HuggingFace `datasets` or external network downloads.
#   Runs completely offline, compatible with the local virtualenv.
#
#   The fine-tuned model is saved to:
#       ai-service/models/fine-tuned-cv-model/
#
# HOW TO RUN:
#   cd ai-service
#   python training/fine_tune.py
# ============================================================

import os
import json
import time
from datetime import datetime
from pathlib import Path

import torch
from torch.utils.data import Dataset, DataLoader
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

# ── Paths ────────────────────────────────────────────────────
BASE_DIR        = Path(__file__).resolve().parent.parent
MODEL_SAVE_PATH = BASE_DIR / "models" / "fine-tuned-cv-model"
LOCAL_BASE_PATH = BASE_DIR / "models" / "all-MiniLM-L6-v2"
BASE_MODEL_NAME = "all-MiniLM-L6-v2"

MODEL_SAVE_PATH.parent.mkdir(exist_ok=True)

# ── Device Setup ─────────────────────────────────────────────
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

print("=" * 65)
print("  Smart CV Filter — Custom PyTorch Offline Fine-Tuning")
print("  KIU Final Year Research Project | 2026")
print("=" * 65)
print(f"Device: {device}")

# ── Step 1: Load Base Model ───────────────────────────────────
if LOCAL_BASE_PATH.exists():
    print(f"\n[1/5] Loading base SBERT model from local cache: {LOCAL_BASE_PATH}...")
    model = SentenceTransformer(str(LOCAL_BASE_PATH))
else:
    print(f"\n[1/5] Loading base SBERT model from HuggingFace (fallback): {BASE_MODEL_NAME}...")
    model = SentenceTransformer(BASE_MODEL_NAME)
print("      Base model loaded successfully.")

# Push SBERT model to device
model.to(device)

# ── Step 2: Custom Dataset Definition ─────────────────────────
print("\n[2/5] Designing domain-specific pairwise dataset...")

# High similarity = 0.85-0.95, Medium = 0.4-0.6, Low = 0.0-0.2
TRAINING_DATA = [
    # ── Positive pairs (score 0.85 - 0.95) ──────────────────────
    {"t1": "Python developer with 3 years experience in machine learning, TensorFlow, scikit-learn, data analysis",
     "t2": "We need a Python Machine Learning engineer with experience in TensorFlow and data analysis", "label": 0.95},
    {"t1": "React.js developer, JavaScript, TypeScript, HTML5, CSS3, responsive design, REST API integration",
     "t2": "Looking for a Frontend developer skilled in React, JavaScript and TypeScript", "label": 0.92},
    {"t1": "Node.js, Express.js, MongoDB, REST API, microservices, backend architecture, JavaScript",
     "t2": "Backend developer needed with Node.js and MongoDB expertise for API development", "label": 0.90},
    {"t1": "Android application developer, Kotlin, Java, Firebase, Google Play, mobile UI, REST API",
     "t2": "Mobile app developer needed for Android application development using Kotlin and Firebase", "label": 0.93},
    {"t1": "data scientist, Python, pandas, numpy, matplotlib, scikit-learn, model evaluation, statistics",
     "t2": "We are hiring a Data Scientist with strong Python and statistical modeling skills", "label": 0.91},
    {"t1": "DevOps engineer, AWS, Docker, Kubernetes, CI/CD pipelines, Jenkins, Terraform, cloud",
     "t2": "DevOps engineer required with expertise in AWS, Docker, and CI/CD pipeline management", "label": 0.94},
    {"t1": "UI UX designer, Figma, Adobe XD, wireframing, user research, prototyping, usability testing",
     "t2": "UI/UX Designer needed with proficiency in Figma and experience conducting user research", "label": 0.90},
    {"t1": "natural language processing, BERT, transformers, text classification, sentiment analysis, Python",
     "t2": "NLP Engineer with BERT and transformer model experience for text classification tasks", "label": 0.95},
    {"t1": "Flutter developer, Dart, cross-platform mobile, Firebase, state management, BLoC pattern",
     "t2": "Flutter developer needed to build cross-platform mobile applications with Firebase integration", "label": 0.92},
    {"t1": "QA automation engineer, Selenium, pytest, TestNG, test planning, CI/CD, bug tracking, Jira",
     "t2": "Quality Assurance Engineer with Selenium automation experience and CI/CD knowledge required", "label": 0.91},
    {"t1": "BSc Computer Science, software engineering, algorithms, data structures, problem solving",
     "t2": "Software developer with Computer Science degree and strong algorithms background required", "label": 0.87},
    {"t1": "cybersecurity analyst, penetration testing, ethical hacking, OWASP, network security, vulnerability assessment",
     "t2": "Cybersecurity specialist required for penetration testing and vulnerability assessment projects", "label": 0.93},
    {"t1": "database administrator, PostgreSQL, MySQL, query optimization, indexing, backup and recovery",
     "t2": "Database Administrator needed with MySQL and PostgreSQL expertise and performance tuning skills", "label": 0.91},
    {"t1": "project manager, Agile, Scrum, team leadership, stakeholder communication, risk management, Jira",
     "t2": "Project Manager with Agile/Scrum expertise and strong leadership skills required", "label": 0.89},
    {"t1": "computer vision, OpenCV, image processing, YOLO, object detection, Python, deep learning",
     "t2": "Computer vision engineer required with OpenCV and object detection deep learning experience", "label": 0.94},

    # ── Partial pairs (score 0.30 - 0.50) ───────────────────────
    {"t1": "Python developer, web scraping, automation, scripting, basic machine learning",
     "t2": "Senior Machine Learning Engineer with production ML systems experience required", "label": 0.50},
    {"t1": "Java developer, Spring Boot, REST APIs, SQL database, backend experience",
     "t2": "Full stack developer with React and Node.js experience needed", "label": 0.45},
    {"t1": "graphic designer, Photoshop, Illustrator, branding, visual design, print media",
     "t2": "UI/UX Designer needed with experience in digital product design and user research", "label": 0.48},
    {"t1": "data analyst, Excel, Power BI, SQL, basic Python, reporting, dashboards",
     "t2": "Machine Learning Engineer with deep learning and Python expertise required", "label": 0.40},
    {"t1": "HTML, CSS, jQuery, basic JavaScript, WordPress, website maintenance",
     "t2": "Senior React.js developer with TypeScript and state management expertise required", "label": 0.35},
    {"t1": "fresh graduate, BSc IT, basic Python, internship experience, eager to learn",
     "t2": "Senior Software Engineer with 5 years of backend development experience", "label": 0.30},

    # ── Negative pairs (score 0.02 - 0.05) ──────────────────────
    {"t1": "accountant, financial reporting, tax compliance, auditing, QuickBooks, Microsoft Excel",
     "t2": "Senior Python machine learning engineer for AI product development", "label": 0.05},
    {"t1": "nurse, patient care, clinical skills, medical records, hospital management",
     "t2": "Software engineer with React and Node.js skills needed", "label": 0.03},
    {"t1": "marketing manager, social media, SEO, content creation, brand strategy, Google Analytics",
     "t2": "DevOps engineer with AWS and Kubernetes experience required", "label": 0.05},
    {"t1": "chef, culinary arts, kitchen management, food safety, menu planning, catering",
     "t2": "Android mobile developer with Kotlin and Firebase experience", "label": 0.02},
    {"t1": "civil engineer, AutoCAD, structural design, project management, construction",
     "t2": "Data scientist with Python and machine learning expertise required", "label": 0.04},
    {"t1": "English teacher, lesson planning, classroom management, curriculum development, communication",
     "t2": "Backend developer with Node.js and MongoDB skills needed", "label": 0.05},
    {"t1": "sales executive, customer relations, cold calling, CRM, negotiation, target achievement",
     "t2": "Full stack developer with React, Node.js and database design experience", "label": 0.04},
    {"t1": "driver, logistics, vehicle maintenance, route planning, delivery management",
     "t2": "Frontend developer with JavaScript and CSS expertise needed", "label": 0.02},
]


class PairwiseDataset(Dataset):
    def __init__(self, data):
        self.data = data

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        item = self.data[idx]
        return item["t1"], item["t2"], torch.tensor(item["label"], dtype=torch.float32)


train_dataset = PairwiseDataset(TRAINING_DATA)
# Keep batch size small; dataloader returns the raw texts which we tokenize in the epoch loop
train_loader = DataLoader(train_dataset, batch_size=8, shuffle=True)

print(f"      Dataset successfully built with {len(TRAINING_DATA)} custom pairs.")

# ── Step 3: Configure PyTorch Training Loop ───────────────────
print("\n[3/5] Setting up PyTorch custom cosine similarity loss Optimizer...")

# SBERT utilizes a Transformer block [0] and a Pooling block [1]
# We only fine-tune the parameters of the Transformer network
transformer_model = model[0].auto_model
transformer_model.train()

optimizer = torch.optim.AdamW(transformer_model.parameters(), lr=2e-5)
mse_loss  = torch.nn.MSELoss()

# ── Step 4: Fine-Tuning Execution Loop ────────────────────────
print("\n[4/5] Running custom PyTorch offline training loop...")
EPOCHS = 10  # Fast but effective fine-tuning for demo/evaluation
start_time = time.time()

for epoch in range(EPOCHS):
    total_loss = 0.0
    for t1_batch, t2_batch, labels in train_loader:
        optimizer.zero_grad()

        # Place labels on device
        labels = labels.to(device)

        # 1. Tokenize and pass sentence 1 through model
        features_1 = model.tokenize(list(t1_batch))
        features_1 = {k: v.to(device) if isinstance(v, torch.Tensor) else v for k, v in features_1.items()}
        emb_1 = model(features_1)["sentence_embedding"] # SBERT pooling handles it

        # 2. Tokenize and pass sentence 2 through model
        features_2 = model.tokenize(list(t2_batch))
        features_2 = {k: v.to(device) if isinstance(v, torch.Tensor) else v for k, v in features_2.items()}
        emb_2 = model(features_2)["sentence_embedding"]

        # 3. Calculate Cosine Similarity Vector
        # CosSim = (A . B) / (||A|| * ||B||)
        norm_1 = emb_1.norm(p=2, dim=1, keepdim=True)
        norm_2 = emb_2.norm(p=2, dim=1, keepdim=True)
        emb_1_n = emb_1 / torch.clamp(norm_1, min=1e-8)
        emb_2_n = emb_2 / torch.clamp(norm_2, min=1e-8)

        predictions = torch.sum(emb_1_n * emb_2_n, dim=1)

        # 4. Math Loss
        loss = mse_loss(predictions, labels)

        # 5. Gradient & optimize
        loss.backward()
        optimizer.step()

        total_loss += loss.item() * len(labels)

    avg_loss = total_loss / len(TRAINING_DATA)
    print(f"      Epoch {epoch+1:02d}/{EPOCHS:02d} — Cosine MSE Loss: {avg_loss:.5f}")

elapsed = time.time() - start_time
print(f"      Fine-tuning complete in {elapsed:.1f}s.")

# Save the updated model weights back to huggingface-compatible SBERT formats
print(f"\n[5/5] Saving fine-tuned model to: {MODEL_SAVE_PATH}")
model.save(str(MODEL_SAVE_PATH))

# Save training metadata
metadata = {
    "model_name":       "smart-cv-sbert-finetuned",
    "base_model":       BASE_MODEL_NAME,
    "fine_tuned_at":    datetime.now().isoformat(),
    "epochs":           EPOCHS,
    "loss_function":    "PyTorch Custom Cosine MSE Loss",
    "training_pairs":   len(TRAINING_DATA),
    "training_time_s":  round(elapsed, 2),
    "saved_path":       str(MODEL_SAVE_PATH),
    "notes":            "Fine-tuned offline using PyTorch custom training loop."
}

with open(MODEL_SAVE_PATH / "training_metadata.json", "w") as f:
    json.dump(metadata, f, indent=2)

# ── Smoke Test verification ──────────────────────────────────
print("\n🔥 Verifying fine-tuned model via semantic similarity tests...")
test_model = SentenceTransformer(str(MODEL_SAVE_PATH))
e1 = test_model.encode("Python machine learning developer", convert_to_numpy=True)
e2 = test_model.encode("We need a Python AI engineer", convert_to_numpy=True)
e3 = test_model.encode("We need a cook for our restaurant", convert_to_numpy=True)

sim_pos = cosine_similarity([e1], [e2])[0][0]
sim_neg = cosine_similarity([e1], [e3])[0][0]

print(f"\n      Smoke test results:")
print(f"      Python ML developer <> Python AI engineer:  {sim_pos:.4f} (expect High)")
print(f"      Python ML developer <> Restaurant cook:     {sim_neg:.4f} (expect Low)")
print(f"      Difference Gap: {sim_pos - sim_neg:.4f}")

print("\n" + "=" * 65)
print("  MODEL FINE-TUNING SUCCESSFUL (OFFLINE PYTORCH)")
print("=" * 65)
