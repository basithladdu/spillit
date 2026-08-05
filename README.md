# Spill It v1.0.0

Welcome to **Spill It** – a playful, anonymous platform where anyone can share what they see in the world with a photo, a color, and a message. No forms, no categories, no judgment.

## Core Features
1. **Mapbox Integration**: Interactive, real-time map showing spills from across the community with live feeds.
2. **Anonymous Spilling**: Snap and upload photos with automatic location tagging – share what you see without revealing who you are.
3. **Free Expression**: Add a custom color, a short message, and optionally who you're sending it to.
4. **Community Feed**: Browse, upvote, and explore spills on a beautiful, fast map interface.
5. **User Accounts**: Optional signup/login to track your spills and contribution history.
6. **Live Updates**: Memory feed updates are read from Supabase and degrade gracefully when the service is unavailable.
7. **Mobile Friendly**: Beautiful, responsive design that works perfectly on any device.

## Getting Started
Spill what's on your mind – a moment, an observation, a broken thing, a beautiful moment.

---

## Developer Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- A Mapbox account (free tier available)
- A Supabase project with a browser-safe URL and anon key

### Quick Start
1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd spillit
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Copy `.env.example` to `.env.local` and add the browser-safe values required by the app:
   ```powershell
   Copy-Item .env.example .env.local
   ```
   At minimum, configure `VITE_MAPBOX_TOKEN`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_ANON_KEY`. Restart Vite after editing environment files. Never put server secrets in `VITE_*` variables.

4. **Run Development Server**
   ```bash
   npm run dev
   ```

## Technologies
- **Frontend**: React 19, Tailwind CSS, Lucide Icons
- **Data and feed**: Supabase
- **Auth and storage helpers**: Firebase
- **AI/ML**: Roboflow, Cloudinary (Video Processing)
- **Maps**: Mapbox GL JS

## License
This project is licensed under the MIT License.
