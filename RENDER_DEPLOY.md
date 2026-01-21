# ☁️ Deploying YOLOv4 to Render

**Render** is a great alternative to Railway. This guide shows you how to deploy the YOLOv4-Tiny backend.

## ✅ Why Render?
- **Native Docker Support**: Uses the `Dockerfile` we just created.
- **Auto-Model Download**: Our Dockerfile automatically downloads the YOLOv4 model during build, so you don't need to struggle with uploading large files!
- **Free Tier**: Available (but spins down after 15mins inactivity).
- **Paid Tier**: $7/month for a standard web service (recommended for faster processing).

---

## 🚀 Deployment Steps

### 1. Push Code to GitHub
Make sure your latest code (including the new `Dockerfile` in `backend/`) is pushed to your GitHub repository.

### 2. Create Web Service on Render
1. Go to [dashboard.render.com](https://dashboard.render.com/)
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository `fixit`.

### 3. Configure the Service
Use these exact settings:

| Setting | Value |
|---------|-------|
| **Name** | `fixit-video-processor` (or anything) |
| **Region** | Closest to you (e.g., Singapore/Ohio) |
| **Root Directory** | `backend` (⚠️ Important!) |
| **Runtime** | **Docker** (⚠️ Important!) |
| **Iustance Type** | **Free** (for testing) or **Starter** ($7/mo) |

**Note on Root Directory**: Since your backend code lives in the `backend/` folder, you **MUST** set the Root Directory to `backend`.

### 4. Add Environment Variables
Scroll down to "Environment Variables" and add these keys (copy from your local `.env` or Railway):

- `CLOUDINARY_CLOUD_NAME`: `fixit`
- `CLOUDINARY_API_KEY`: `435969829275136`
- `CLOUDINARY_API_SECRET`: `hcqg6yQ4TUjuVGW-eWvE7Nngw2w`
- `PORT`: `5000` (Optional, Render sets this automatically, but good to be explicit)

### 5. Deploy!
Click **Create Web Service**.

---

## ⏳ What happens next?
1. Render will read the `Dockerfile`.
2. It installs Python and OpenCV system dependencies.
3. **It downloads the YOLOv4-Tiny weights** automatically (you'll see this in the logs).
4. It starts Gunicorn.

Once it's live, you will get a URL like: `https://fixit-video-processor.onrender.com`

---

## 🔌 Connecting to Frontend
1. Copy your new Render URL.
2. Go to your frontend code (`src/config/videoProcessorConfig.js` or similar).
3. Update the `baseUrl`:
   ```javascript
   baseUrl: 'https://fixit-video-processor.onrender.com',
   ```
4. Commit and deploy your frontend.

---

## 🐛 Troubleshooting

**"Build Failed"**
Check the logs. Usually, it's a missing file in `requirements.txt`. Ensure `opencv-python-headless` is listed.

**"Timeout" / 502 Bad Gateway**
Processing video takes time.
- **Cause**: Render's load balancer expects a response within 30-60s.
- **Solution**: Our code processes every 3rd frame to be fast. If it's still too slow, try processing every 5th frame by changing `FRAME_INTERVAL_SECONDS` in `video_processor_tiny.py`.

**"Memory Limit Exceeded"**
- The Free tier has 512MB RAM.
- **Solution**: Our YOLOv4-Tiny setup is optimized for this. If it crashes, upgrade to the Starter plan ($7/mo).
