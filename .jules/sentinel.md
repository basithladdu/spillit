## 2025-02-18 - Hardcoded Cloudinary Credentials
**Vulnerability:** Hardcoded Cloudinary API Key and Secret found in `backend/video_processor.py` and `backend/video_processor_yolov4.py`.
**Learning:** Developers often hardcode credentials for local testing and forget to remove them before committing. The code had fallback values that were actual secrets.
**Prevention:** Always use environment variables for secrets. Implement a startup check that fails if required secrets are missing, rather than falling back to hardcoded values.

## 2025-10-27 - Hardcoded Roboflow API Key
**Vulnerability:** Hardcoded Roboflow API Key found in `src/utils/roboflow.js` and `functions/index.js`.
**Learning:** Secrets duplicated across frontend and backend codebases increase the risk of exposure and make rotation difficult.
**Prevention:** Centralize secret management where possible or strictly enforce environment variable usage across all environments (Frontend/Backend).
