# ============================================================
# Smart CV Filter — AI Microservice (FastAPI + Sentence-BERT)
# ============================================================
# This service handles:
#   1. Generating SBERT embeddings for CV skill text
#   2. Semantic search: ranking CVs by cosine similarity to a query
#   3. Comparing SBERT vs keyword matching (for research evaluation)
# ============================================================

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from typing import List, Optional
import uvicorn
import time

app = FastAPI(
    title="Smart CV Filter — AI Service",
    description="SBERT-powered semantic CV search engine",
    version="1.0.0"
)

# ── CORS ────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Load SBERT Model ─────────────────────────────────────────
# Priority order:
#   1. Fine-tuned model (domain-adapted on CV data) — BEST accuracy
#   2. Local base model (offline cache)
#   3. HuggingFace download (first-time setup)
import os

# MODEL_NAME         = "all-MiniLM-L6-v2"
# LOCAL_MODEL_PATH   = "./models/all-MiniLM-L6-v2"
# FINETUNED_MODEL_PATH = "./models/fine-tuned-cv-model"
MODEL_NAME = "all-MiniLM-L6-v2"
LOCAL_MODEL_PATH = "./models/all-MiniLM-L6-v2"

# Increase timeout for slow connections
os.environ['HF_HUB_DOWNLOAD_TIMEOUT'] = '120'

print("Loading Sentence-BERT model...")
model       = None
model_label = MODEL_NAME  # for logging / health check

# ── Priority 1: Load fine-tuned domain-specific model ────────
if os.path.exists(FINETUNED_MODEL_PATH):
    try:
        model       = SentenceTransformer(FINETUNED_MODEL_PATH)
        model_label = "smart-cv-sbert-finetuned (fine-tuned on CV domain data)"
        print(f"[OK] Fine-tuned CV model loaded from: {FINETUNED_MODEL_PATH}")
    except Exception as e:
        print(f"[WARN] Fine-tuned model load failed: {e} -- falling back...")
        model = None

# ── Priority 2: Load from local base model cache ─────────────
if model is None and os.path.exists(LOCAL_MODEL_PATH):
    try:
        model       = SentenceTransformer(LOCAL_MODEL_PATH)
        model_label = MODEL_NAME + " (local cache)"
        print(f"[OK] Base model loaded from local folder: {LOCAL_MODEL_PATH}")
    except Exception as e:
        print(f"[WARN] Local load failed: {e} -- trying network...")
        model = None

# ── Priority 3: Download from HuggingFace ────────────────────
if model is None:
    print(f"[NET] Downloading model from HuggingFace: {MODEL_NAME}")
    print("   (This downloads ~90MB on first run -- please wait...)")
    for attempt in range(3):
        try:
            model       = SentenceTransformer(MODEL_NAME)
            model_label = MODEL_NAME
            # Save locally so next time it loads offline
            os.makedirs("./models", exist_ok=True)
            model.save(LOCAL_MODEL_PATH)
            print(f"[OK] Model '{MODEL_NAME}' downloaded and cached locally.")
            break
        except Exception as e:
            if attempt < 2:
                print(f"   Retry {attempt + 1}/3 -- waiting 3s...")
                time.sleep(3)
            else:
                print(f"[ERROR] Failed to load model: {e}")
                print()
                print("SOLUTION: Run this command to download the model manually:")
                print("  python download_model.py")
                raise RuntimeError(
                    f"Cannot load SBERT model. "
                    f"Please run: python download_model.py"
                ) from e


# ── Request/Response Schemas ─────────────────────────────────

class EmbedRequest(BaseModel):
    text: str

class EmbedResponse(BaseModel):
    embedding: List[float]
    model: str
    text_length: int

class SearchRequest(BaseModel):
    query: str
    cv_ids: List[str]
    embeddings: List[List[float]]

class SearchResponse(BaseModel):
    ranked_ids: List[str]
    scores: List[float]
    query: str
    time_ms: float

class KeywordSearchRequest(BaseModel):
    query: str
    cv_ids: List[str]
    skills_texts: List[str]   # Raw text skills for keyword comparison

class CompareRequest(BaseModel):
    query: str
    cv_ids: List[str]
    embeddings: List[List[float]]
    skills_texts: List[str]


# ── Endpoints ────────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "service": "Smart CV Filter AI Service",
        "model":   model_label,
        "status":  "running",
        "fine_tuned": os.path.exists(FINETUNED_MODEL_PATH)
    }

@app.get("/health")
def health():
    return {
        "status": "OK",
        "model":  model_label,
        "fine_tuned": os.path.exists(FINETUNED_MODEL_PATH)
    }


# ── POST /embed ──────────────────────────────────────────────
# Generate a SBERT embedding vector for a given text
@app.post("/embed", response_model=EmbedResponse)
def embed_text(request: EmbedRequest):
    """
    Takes a string of text (e.g., CV skills + description)
    Returns a 384-dimensional embedding vector
    """
    if not request.text or not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    # Generate embedding — returns numpy array of shape (384,)
    embedding = model.encode(request.text.strip(), convert_to_numpy=True)

    return EmbedResponse(
        embedding=embedding.tolist(),
        model=MODEL_NAME,
        text_length=len(request.text)
    )


# ── POST /search ─────────────────────────────────────────────
# Semantic search: rank CVs by cosine similarity to a query
@app.post("/search", response_model=SearchResponse)
def semantic_search(request: SearchRequest):
    """
    CORE AI FUNCTION:
    1. Embed the search query using SBERT
    2. Compute cosine similarity between query and all CV embeddings
    3. Return CV IDs ranked from highest to lowest similarity

    This is the key feature that makes the system smarter than keyword matching.
    Searching "machine learning engineer" will also match CVs with
    "deep learning", "AI developer", "neural networks" — without any keyword overlap.
    """
    start_time = time.time()

    if not request.cv_ids or not request.embeddings:
        raise HTTPException(status_code=400, detail="No CVs provided")

    if len(request.cv_ids) != len(request.embeddings):
        raise HTTPException(status_code=400, detail="cv_ids and embeddings length mismatch")

    # 1. Embed the query
    query_embedding = model.encode(request.query.strip(), convert_to_numpy=True)
    query_embedding = query_embedding.reshape(1, -1)  # Shape: (1, 384)

    # 2. Stack all CV embeddings into a matrix
    cv_matrix = np.array(request.embeddings)  # Shape: (n_cvs, 384)

    # 3. Compute cosine similarity — range: -1 to 1 (higher = more similar)
    similarities = cosine_similarity(query_embedding, cv_matrix)[0]  # Shape: (n_cvs,)

    # 4. Sort by similarity descending
    sorted_indices = np.argsort(similarities)[::-1]

    ranked_ids = [request.cv_ids[i] for i in sorted_indices]
    scores     = [float(similarities[i]) for i in sorted_indices]

    elapsed_ms = round((time.time() - start_time) * 1000, 2)

    return SearchResponse(
        ranked_ids=ranked_ids,
        scores=scores,
        query=request.query,
        time_ms=elapsed_ms
    )


# ── POST /search/keyword ─────────────────────────────────────
# Keyword search (TF-IDF baseline for research comparison)
@app.post("/search/keyword")
def keyword_search(request: KeywordSearchRequest):
    """
    BASELINE METHOD for research comparison:
    Simple keyword matching — counts how many query words appear in skills text.
    Used to compare against SBERT semantic search accuracy.
    """
    start_time = time.time()

    query_words = set(request.query.lower().split())
    scores = []

    for skills_text in request.skills_texts:
        text_words = set(skills_text.lower().split())
        # Simple intersection score
        matches = len(query_words.intersection(text_words))
        score = matches / len(query_words) if query_words else 0
        scores.append(score)

    scores_array = np.array(scores)
    sorted_indices = np.argsort(scores_array)[::-1]

    ranked_ids = [request.cv_ids[i] for i in sorted_indices]
    ranked_scores = [float(scores_array[i]) for i in sorted_indices]

    elapsed_ms = round((time.time() - start_time) * 1000, 2)

    return {
        "ranked_ids": ranked_ids,
        "scores": ranked_scores,
        "query": request.query,
        "method": "keyword_tfidf",
        "time_ms": elapsed_ms
    }


# ── POST /compare ────────────────────────────────────────────
# Compare SBERT vs keyword — returns both results side by side
# This is used for your research evaluation (Section 7.4)
@app.post("/compare")
def compare_methods(request: CompareRequest):
    """
    Research evaluation endpoint.
    Runs both SBERT and keyword search on the same query and dataset,
    returns both ranked lists so you can measure Precision@10, Recall@10, F1.
    """
    # SBERT search
    query_embedding = model.encode(request.query.strip(), convert_to_numpy=True).reshape(1, -1)
    cv_matrix = np.array(request.embeddings)
    sbert_similarities = cosine_similarity(query_embedding, cv_matrix)[0]
    sbert_sorted = np.argsort(sbert_similarities)[::-1]

    # Keyword search
    query_words = set(request.query.lower().split())
    keyword_scores = []
    for text in request.skills_texts:
        text_words = set(text.lower().split())
        matches = len(query_words.intersection(text_words))
        score = matches / len(query_words) if query_words else 0
        keyword_scores.append(score)
    keyword_sorted = np.argsort(np.array(keyword_scores))[::-1]

    return {
        "query": request.query,
        "sbert": {
            "ranked_ids": [request.cv_ids[i] for i in sbert_sorted],
            "scores":     [round(float(sbert_similarities[i]), 4) for i in sbert_sorted]
        },
        "keyword": {
            "ranked_ids": [request.cv_ids[i] for i in keyword_sorted],
            "scores":     [round(float(keyword_scores[i]), 4) for i in keyword_sorted]
        }
    }


# ── Run Server ───────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
