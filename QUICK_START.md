# 🎉 Spill It - Quick Start Guide

Welcome to **Spill It** – the anonymous community messaging platform!

---

## 🚀 Get Started in 3 Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create a `.env` file:
```env
VITE_MAPBOX_TOKEN=your_mapbox_token_here
VITE_FIREBASE_API_KEY=your_firebase_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 3. Run Locally
```bash
npm run dev
```

Then open http://localhost:5173 in your browser!

---

## 📱 Features You Can Explore

- **🗺️ Live Map:** See real-time spills from your community
- **📸 Post a Spill:** Upload photo + message + location
- **⭐ Upvote:** Show love to spills you like
- **🏆 Leaderboard:** See top spillers in the community
- **📷 Gallery:** Browse all spills in a beautiful grid
- **👤 Account:** Optional signup to track your spills

---

## 🛠️ Build for Production
```bash
npm run build
```

The build output goes to the `dist/` folder.

---

## 📝 Project Structure

```
src/
├── pages/           # Main route pages
├── components/      # Reusable React components
├── utils/           # Firebase, image optimization
├── hooks/           # Auth, data fetching
├── context/         # Auth context
└── App.jsx          # Main app component
```

---

## 🔑 Key Routes

| Path | Purpose |
|------|---------|
| `/` | Home - Map + live feed |
| `/report/:id` | View individual spill |
| `/gallery` | Browse all spills |
| `/leaderboard` | Top contributors |
| `/login` | User login |
| `/register` | Sign up |
| `/about` | About Spill It |
| `/help` | FAQ & support |

---

## 🎨 Customization

### Change Colors
Edit CSS variables in `src/App.css`:
```css
:root {
  --fixit-primary: #FF671F;      /* Main accent */
  --fixit-secondary: #046A38;    /* Secondary */
  --fixit-bg: #0A0A1E;           /* Background */
  --fixit-text-main: #FFFFFF;    /* Text */
}
```

### Add Your Branding
- Update `public/favicon.ico`
- Update title in `index.html`
- Update About page content in `src/pages/About.jsx`

---

## 🔧 Useful Commands

```bash
# Development
npm run dev          # Start dev server

# Building
npm run build        # Build for production
npm run preview      # Preview production build

# Linting
npm run lint         # Check code quality

# Deployment
firebase deploy      # Deploy to Firebase
vercel deploy        # Deploy to Vercel
```

---

## 📚 Documentation

- **SPILLIT_TRANSFORMATION.md** - Detailed transformation log
- **README.md** - Full project documentation

---

## 💡 Tips

1. **Test Locally First** - Run `npm run dev` before deploying
2. **Check Firebase Rules** - Make sure Firestore security rules allow reads/writes
3. **Mapbox Quota** - Monitor API usage at mapbox.com
4. **Image Upload** - Cloudinary account needed for image uploads
5. **Mobile Testing** - Use DevTools device emulation

---

## 🚨 Troubleshooting

**Pages not loading?**
- Check if all environment variables are set
- Check browser console for errors
- Verify Firebase credentials are correct

**Map not showing?**
- Verify Mapbox token is valid
- Check map container has height/width

**Images not uploading?**
- Check Cloudinary upload preset
- Verify file size isn't too large

**Auth not working?**
- Check Firebase Auth is enabled
- Verify email authentication is configured

---

## 🎯 What's Different from Original?

This is **not** a civic reporting platform anymore. It's:
- ✅ Anonymous-first (no government involvement)
- ✅ Community-driven (upvotes, leaderboards)
- ✅ Judgment-free (any photo + message)
- ✅ Playful (custom colors, free expression)
- ✅ Optional accounts (post without login)

---

## 📞 Support

For help:
1. Check `src/pages/Help.jsx` for FAQ
2. Read `src/pages/About.jsx` for more info
3. Check browser console for error messages
4. Review environment configuration

---

**Happy Spilling! 🎨📸✨**
