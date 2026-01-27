## 2025-02-18 - Hardcoded Cloudinary Credentials
**Vulnerability:** Hardcoded Cloudinary API Key and Secret found in `backend/video_processor.py` and `backend/video_processor_yolov4.py`.
**Learning:** Developers often hardcode credentials for local testing and forget to remove them before committing. The code had fallback values that were actual secrets.
**Prevention:** Always use environment variables for secrets. Implement a startup check that fails if required secrets are missing, rather than falling back to hardcoded values.
