# 🎬 Cloudinary Setup for Video Processor

## Quick Setup (2 Minutes)

You're already using Cloudinary with cloud name **`fixit`**. You just need to create a new upload preset for videos.

### Step 1: Login to Cloudinary
Go to: https://console.cloudinary.com/

### Step 2: Create Upload Preset for Videos

1. Click **Settings** (gear icon) in the top right
2. Click **Upload** tab on the left
3. Scroll down to **Upload presets**
4. Click **Add upload preset**

### Step 3: Configure the Preset

Fill in these settings:

| Setting | Value |
|---------|-------|
| **Preset name** | `fixit_videos` |
| **Signing mode** | **Unsigned** (IMPORTANT!) |
| **Folder** | `dashcam_videos` |
| **Resource type** | `Video` |
| **Access mode** | `Public` |
| **Unique filename** | ✅ Enabled |
| **Overwrite** | ❌ Disabled |

### Step 4: Save

Click **Save** at the bottom.

---

## ✅ That's It!

Your configuration is already set to use:
- **Cloud Name**: `fixit` ✅
- **Upload Preset**: `fixit_videos` (you just created this)
- **Folder**: `dashcam_videos` (videos will be organized here)

---

## 🧪 Test It

1. Go to Municipal Dashboard
2. Click "Video Processor" in sidebar
3. Click "Upload Dashcam Video"
4. Select a test video
5. Video uploads to: `https://res.cloudinary.com/fixit/video/upload/dashcam_videos/your-video.mp4`

---

## 📁 Folder Structure in Cloudinary

After uploading, your Cloudinary will have:

```
fixit (your cloud)
├── dashcam_videos/          ← New folder for videos
│   ├── video1.mp4
│   ├── video2.mp4
│   └── ...
└── (your existing images)
```

---

## 🔧 Troubleshooting

### "Upload widget not ready"
→ Refresh the page

### "Upload failed: Invalid upload preset"
→ Make sure preset name is exactly `fixit_videos`
→ Make sure it's set to **Unsigned** mode

### "Upload failed: Resource type not allowed"
→ Make sure Resource type is set to `Video` in the preset

---

## 🎯 Next Step

After creating the preset, you need to deploy the backend to Railway.

See: `VIDEO_PROCESSOR_README.md` for Railway deployment instructions.

---

**You're using the same Cloudinary account - just a new folder for videos! 🎉**
