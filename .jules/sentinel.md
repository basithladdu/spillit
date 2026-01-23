# Sentinel Security Journal

This journal records critical security vulnerabilities, learnings, and prevention strategies for this project.

## Format
`## YYYY-MM-DD - [Title]`
`**Vulnerability:** [What you found]`
`**Learning:** [Why it existed]`
`**Prevention:** [How to avoid next time]`

---
## 2025-01-23 - Hardcoded Roboflow API Key
**Vulnerability:** A hardcoded Roboflow API key was found in `src/utils/roboflow.js`, exposing it to anyone with source code access.
**Learning:** Hardcoding credentials in frontend code (even if the API is public-facing) can lead to quota abuse or unauthorized usage if the key is intended to be private or rate-limited.
**Prevention:** Always use environment variables (e.g., `import.meta.env.VITE_*`) for configuration and secrets. Ensure `.env` is git-ignored and provide a `.env.example`.
