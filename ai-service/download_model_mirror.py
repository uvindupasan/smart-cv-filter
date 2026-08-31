"""
Smart CV Filter — SBERT Model Downloader (Mirror version)
Uses hf-mirror.com instead of huggingface.co to bypass network blocks.
"""
import os
import sys
import time

# Use mirror endpoint BEFORE any HF imports
os.environ['HF_ENDPOINT'] = 'https://hf-mirror.com'
os.environ['HF_HUB_DOWNLOAD_TIMEOUT'] = '120'
os.environ['HUGGINGFACE_HUB_VERBOSITY'] = 'warning'

print("=" * 60)
print("Smart CV Filter - SBERT Model Downloader (Mirror)")
print("Mirror: https://hf-mirror.com")
print("=" * 60)
print()

from sentence_transformers import SentenceTransformer

MODEL_NAME   = "sentence-transformers/all-MiniLM-L6-v2"
SAVE_PATH    = "./models/all-MiniLM-L6-v2"
MAX_ATTEMPTS = 3

print("Model : " + MODEL_NAME)
print("Save  : " + SAVE_PATH)
print()

for attempt in range(1, MAX_ATTEMPTS + 1):
    print("Attempt " + str(attempt) + "/" + str(MAX_ATTEMPTS) + " -- downloading via mirror...")
    try:
        model = SentenceTransformer(MODEL_NAME)
        os.makedirs("./models", exist_ok=True)
        model.save(SAVE_PATH)
        print()
        print("=" * 60)
        print("SUCCESS! Model downloaded and saved.")
        print("Location: " + os.path.abspath(SAVE_PATH))
        print()
        print("Now run:  python main.py")
        print("=" * 60)
        sys.exit(0)
    except Exception as e:
        print("FAILED attempt " + str(attempt) + ": " + str(e))
        if attempt < MAX_ATTEMPTS:
            print("Retrying in 5 seconds...")
            time.sleep(5)

print()
print("=" * 60)
print("ALL ATTEMPTS FAILED.")
print()
print("MANUAL FIX:")
print("  1. Open browser and go to:")
print("     https://hf-mirror.com/sentence-transformers/all-MiniLM-L6-v2")
print("  2. Click 'Files and versions' tab")
print("  3. Download ALL files listed there")
print("  4. Create folder:")
print("     " + os.path.abspath(SAVE_PATH))
print("  5. Place all downloaded files inside that folder")
print("  6. Run: python main.py")
print("=" * 60)
sys.exit(1)
