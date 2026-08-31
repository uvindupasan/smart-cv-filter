"""
Smart CV Filter - SBERT Manual File Downloader
Uses 'requests' library (different from httpx) to download model files.
This often works when the default HuggingFace client fails.
"""
import os
import sys

# Patch: Force huggingface_hub to use requests backend
os.environ['HF_HUB_DOWNLOAD_TIMEOUT'] = '180'

# Try direct download using 'requests' first
import requests

SAVE_DIR = "./models/all-MiniLM-L6-v2"
BASE_URL = "https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2/resolve/main"

FILES = [
    "config.json",
    "tokenizer_config.json",
    "tokenizer.json",
    "vocab.txt",
    "special_tokens_map.json",
    "sentence_bert_config.json",
    "modules.json",
    "README.md",
    "pytorch_model.bin",
    "1_Pooling/config.json",
]

def download_file(url, dest_path):
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    print("  Downloading: " + os.path.basename(dest_path) + " ...", end="", flush=True)
    try:
        resp = requests.get(url, stream=True, timeout=180, verify=True)
        resp.raise_for_status()
        total = int(resp.headers.get("content-length", 0))
        downloaded = 0
        with open(dest_path, "wb") as f:
            for chunk in resp.iter_content(chunk_size=65536):
                if chunk:
                    f.write(chunk)
                    downloaded += len(chunk)
        size_mb = downloaded / (1024 * 1024)
        print(" OK ({:.2f} MB)".format(size_mb))
        return True
    except Exception as e:
        print(" FAILED: " + str(e))
        return False

print("=" * 60)
print("Downloading SBERT model files via requests library")
print("Destination: " + os.path.abspath(SAVE_DIR))
print("=" * 60)
print()

os.makedirs(SAVE_DIR, exist_ok=True)
os.makedirs(SAVE_DIR + "/1_Pooling", exist_ok=True)

failed = []
for f in FILES:
    url = BASE_URL + "/" + f
    dest = os.path.join(SAVE_DIR, f)
    success = download_file(url, dest)
    if not success:
        failed.append(f)

print()
if not failed:
    print("=" * 60)
    print("ALL files downloaded successfully!")
    print()
    print("Now run: python main.py")
    print("=" * 60)
    sys.exit(0)
else:
    print("Failed files:")
    for f in failed:
        print("  - " + f)
    print()
    print("Some files failed. Check internet and try again.")
    sys.exit(1)
