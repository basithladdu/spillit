# FixIt - Municipal Infrastructure Management System

A modern React application for managing municipal infrastructure issues with real-time mapping and reporting capabilities.

## Features

- 🗺️ **Interactive Maps** - Powered by Mapbox GL JS with Google Maps-like styling
- 🔥 **Heatmap Visualization** - View issue density across regions
- 📊 **Municipal Dashboard** - Comprehensive analytics and reporting
- 🎨 **Light/Dark Mode** - Adaptive UI themes
- 📱 **Responsive Design** - Works seamlessly on all devices

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- A Mapbox account (free tier available)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd fixit
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit the `.env` file and add your Mapbox access token:

```env
VITE_MAPBOX_TOKEN=your_mapbox_token_here
```

#### Getting a Mapbox Token:

1. Sign up for a free account at [Mapbox](https://account.mapbox.com/auth/signup/)
2. Navigate to your [Access Tokens page](https://account.mapbox.com/access-tokens/)
3. Copy your default public token or create a new one
4. Paste it in your `.env` file

> **Note:** The free tier includes 50,000 map loads per month, which is sufficient for most development and small production deployments.

### 4. Run the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### 5. Build for Production

```bash
npm run build
```

The production-ready files will be in the `dist` directory.

## Project Structure

```
fixit/
├── src/
│   ├── components/        # Reusable React components
│   │   └── DashboardMap.jsx  # Mapbox map component
│   ├── features/          # Feature-specific components
│   ├── assets/            # Static assets
│   └── App.jsx            # Main application component
├── public/                # Public static files
├── .env.example           # Environment variables template
└── package.json           # Project dependencies
```

## Technologies Used

- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **Mapbox GL JS** - Interactive maps
- **react-map-gl** - React wrapper for Mapbox
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library
- **Firebase** - Backend and authentication

## Map Configuration

The application uses Mapbox GL JS with the following settings:

- **Map Style**: `streets-v12` (Google Maps-like appearance for both light and dark themes)
- **Default Location**: Andhra Pradesh, India (Vijayawada region)
- **Default Zoom**: 7 (shows the entire state)

The map automatically adapts to your theme while maintaining the familiar Google Maps aesthetic.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please open an issue on the GitHub repository.

