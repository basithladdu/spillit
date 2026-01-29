import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import 'mapbox-gl/dist/mapbox-gl.css';
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import { Suspense, lazy } from "react";
import { Analytics } from "@vercel/analytics/react"
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Lazy load pages
const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Team = lazy(() => import("./pages/Team"));
const NotFound = lazy(() => import("./pages/NotFound"));
const About = lazy(() => import("./pages/About"));
const Report = lazy(() => import("./pages/Report"));
const Gallery = lazy(() => import("./pages/Gallery"));
const Help = lazy(() => import("./pages/Help"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const SIH2025 = lazy(() => import("./pages/SIH2025"));
const Partner = lazy(() => import("./pages/Partner"));
const AdminDonors = lazy(() => import("./pages/AdminDonors"));
const Donors = lazy(() => import("./pages/Donors"));
const BecomeDonor = lazy(() => import("./pages/BecomeDonor"));
// Municipal Pages
const MunicipalRegistration = lazy(() => import("./pages/MunicipalRegistration"));
const MunicipalDashboard = lazy(() => import("./pages/MunicipalDashboard"));
const OpsDashboard = lazy(() => import("./pages/OpsDashboard"));

import "./App.css";
import "./styles/municipal.css";


// Loading Component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-[#0A0A1E]">
    <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

function App() {

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-950 dark:via-black dark:to-gray-800 text-black dark:text-white transition-colors duration-300">
        <Navbar />

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
            <Route path="/about" element={<About />} />
            <Route path="/sih2025" element={<SIH2025 />} />
            <Route path="/partner" element={<Partner />} />
            <Route path="/admin/donors" element={<AdminDonors />} />
            <Route path="/donors" element={<Donors />} />
            <Route path="/become-donor" element={<BecomeDonor />} />

            {/* Municipal Routes */}
            <Route path="/municipal-register" element={<MunicipalRegistration />} />
            <Route
              path="/municipal-dashboard"
              element={
                <ProtectedRoute role="municipal_admin">
                  <MunicipalDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/municipal-dashboard/tracker"
              element={
                <ProtectedRoute role="municipal_admin">
                  <MunicipalDashboard initialView="tracker" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/municipal-dashboard/pothole-detection"
              element={
                <ProtectedRoute role="municipal_admin">
                  <MunicipalDashboard initialView="pothole-detection" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/municipal-dashboard/grouped-reports"
              element={
                <ProtectedRoute role="municipal_admin">
                  <MunicipalDashboard initialView="grouped-reports" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/municipal-dashboard/video-processor"
              element={
                <ProtectedRoute role="municipal_admin">
                  <MunicipalDashboard initialView="video-processor" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/municipal-dashboard/leaderboard"
              element={
                <ProtectedRoute role="municipal_admin">
                  <MunicipalDashboard initialView="leaderboard" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/municipal-dashboard/about"
              element={
                <ProtectedRoute role="municipal_admin">
                  <MunicipalDashboard initialView="about" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/municipal-dashboard/settings"
              element={
                <ProtectedRoute role="municipal_admin">
                  <MunicipalDashboard initialView="settings" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ops-dashboard"
              element={
                <ProtectedRoute>
                  <OpsDashboard />
                </ProtectedRoute>
              }
            />

            {/* 
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            /> 
            */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        <Analytics />
        <ToastContainer
          position="bottom-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />
      </div>
    </AuthProvider>
  );
}

export default App;