# LetsFixIndia v1.0.0 Launch

Welcome to the first official release of **LetsFixIndia**! This platform is designed to empower citizens and municipal authorities to report, track, and resolve civic issues in real-time.

## Core Features
1. **Mapbox Integration**: Interactive, high-performance map to browse community reports with heatmaps and clustering.
2. **Issue Reporting**: Snap and upload photos of civic problems with automatic location tagging.
3. **Advanced AI Detection**: High-precision AI analysis powered by Roboflow to detect potholes, assess severity (Area in cm²), and validate reports automatically.
4. **Smart Department Routing**: Intellectual routing system that automatically assigns issues to the correct department (NHAI, RNB, Municipal Corp) based on location and type.
5. **Real-time Tracking**: Live updates on report status using Firebase with instant notifications.
6. **Secure Architecture**: Built with modern security practices and environment-managed credentials.
7. **Mobile Optimized**: Designed to work seamlessly on-the-go for field officers and citizens.

## Getting Started
Join the movement to build better cities. Report your first issue today!

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
   cd fixit
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
