import { Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import 'mapbox-gl/dist/mapbox-gl.css';
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import { Suspense, lazy } from "react";

// Lazy load pages
const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Team = lazy(() => import("./pages/Team"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Report = lazy(() => import("./pages/Report"));
const Gallery = lazy(() => import("./pages/Gallery"));
const Help = lazy(() => import("./pages/Help"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const SIH2025 = lazy(() => import("./pages/SIH2025"));

import "./App.css";
import "leaflet/dist/leaflet.css";

// Loading Component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-[#0A0A1E]">
    <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

function App() {
  const location = useLocation();

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-950 dark:via-black dark:to-gray-800 text-black dark:text-white transition-colors duration-300">
        {/* Conditionally render the Navbar */}
        {location.pathname !== '/' && <Navbar />}

        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/report/:id" element={<Report />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/help" element={<Help />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/team" element={<Team />} />
            <Route path="/sih2025" element={<SIH2025 />} />

            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </div>
    </AuthProvider>
  );
}

export default App;