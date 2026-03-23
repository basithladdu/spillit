# Spill It v1.0.0

Welcome to **Spill It** – a playful, anonymous platform where anyone can share what they see in the world with a photo, a color, and a message. No forms, no categories, no judgment.

## Core Features
1. **Mapbox Integration**: Interactive, real-time map showing spills from across the community with live feeds.
2. **Anonymous Spilling**: Snap and upload photos with automatic location tagging – share what you see without revealing who you are.
3. **Free Expression**: Add a custom color, a short message, and optionally who you're sending it to.
4. **Community Feed**: Browse, upvote, and explore spills on a beautiful, fast map interface.
5. **User Accounts**: Optional signup/login to track your spills and contribution history.
6. **Real-time Updates**: Live feeds powered by Firebase with instant notifications.
7. **Mobile Friendly**: Beautiful, responsive design that works perfectly on any device.

## Getting Started
Spill what's on your mind – a moment, an observation, a broken thing, a beautiful moment.

---

## Developer Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- A Mapbox account (free tier available)

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
   Create a `.env` file based on `.env.example` and add your keys:
   ```env
   VITE_MAPBOX_TOKEN=your_token_here
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

## Technologies
- **Frontend**: React 19, Tailwind CSS, Lucide Icons
- **Backend**: Firebase (Firestore, Auth, Storage)
- **AI/ML**: Roboflow, Cloudinary (Video Processing)
- **Maps**: Mapbox GL JS

## License
This project is licensed under the MIT License.
