# Sentinel Security Journal

This journal records critical security vulnerabilities, learnings, and prevention strategies for this project.

## Format
`## YYYY-MM-DD - [Title]`
`**Vulnerability:** [What you found]`
`**Learning:** [Why it existed]`
`**Prevention:** [How to avoid next time]`

---

## 2025-02-18 - Hardcoded Cloudinary Credentials
**Vulnerability:** Hardcoded Cloudinary API Key and Secret found in `backend/video_processor.py` and `backend/video_processor_yolov4.py`.
**Learning:** Developers often hardcode credentials for local testing and forget to remove them before committing. The code had fallback values that were actual secrets.
**Prevention:** Always use environment variables for secrets. Implement a startup check that fails if required secrets are missing, rather than falling back to hardcoded values.

## 2025-10-27 - Hardcoded Roboflow API Key
**Vulnerability:** Hardcoded Roboflow API Key found in `src/utils/roboflow.js` and `functions/index.js`.
**Learning:** Secrets duplicated across frontend and backend codebases increase the risk of exposure and make rotation difficult.
**Prevention:** Centralize secret management where possible or strictly enforce environment variable usage across all environments (Frontend/Backend).

## 2025-01-23 - Hardcoded Roboflow API Key
**Vulnerability:** A hardcoded Roboflow API key was found in `src/utils/roboflow.js`, exposing it to anyone with source code access.
**Learning:** Hardcoding credentials in frontend code (even if the API is public-facing) can lead to quota abuse or unauthorized usage if the key is intended to be private or rate-limited.
**Prevention:** Always use environment variables (e.g., `import.meta.env.VITE_*`) for configuration and secrets. Ensure `.env` is git-ignored and provide a `.env.example`.
