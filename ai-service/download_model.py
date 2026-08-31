"""
Model Download Script - Smart CV Filter
Downloads the SBERT model to a local 'models' folder so it
can be used offline without HuggingFace network dependency.
"""

import os
import sys

# Set longer timeout BEFORE imports
os.environ['HF_HUB_DOWNLOAD_TIMEOUT'] = '120'
os.environ['TRANSFORMERS_VERBOSITY'] = 'info'
os.environ['CURL_CA_BUNDLE'] = ''

print("=" * 60)
print("Smart CV Filter — SBERT Model Downloader")
print("=" * 60)
print()

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
SAVE_PATH = "./models/all-MiniLM-L6-v2"

print(f"Downloading: {MODEL_NAME}")
print(f"Save to:     {SAVE_PATH}")
print()
print("⏳ This may take 2-5 minutes (~90MB download)...")
print("   Make sure you have internet connection!")
print()

try:
    from sentence_transformers import SentenceTransformer

    # Download and save locally
    model = SentenceTransformer(MODEL_NAME)
    model.save(SAVE_PATH)

    print()
    print("=" * 60)
    print("✅ Model downloaded and saved successfully!")
    print(f"   Location: {os.path.abspath(SAVE_PATH)}")
    print()
    print("Now run: python main.py")
    print("=" * 60)

except Exception as e:
    print(f"\n❌ Download failed: {e}")
    print()
    print("Try alternative: run download_model_alt.py")
    sys.exit(1)
