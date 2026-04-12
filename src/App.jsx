import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import 'mapbox-gl/dist/mapbox-gl.css';
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
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
const NotFound = lazy(() => import("./pages/NotFound"));
const About = lazy(() => import("./pages/About"));
const MemoryDetail = lazy(() => import("./pages/MemoryDetail"));
const Gallery = lazy(() => import("./pages/Gallery"));
const Help = lazy(() => import("./pages/Help"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));

import "./App.css";

// Loading Component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
  </div>
);

function App() {

  return (
    <AuthProvider>
      <div className="min-h-screen bg-background text-foreground transition-colors duration-300 flex flex-col">
        <Navbar />

        <div className="flex-1 pt-16">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/memory/:id" element={<MemoryDetail />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/help" element={<Help />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/about" element={<About />} />
              <Route path="/dashboard" element={<Dashboard />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </div>

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
          theme="light"
        />
        <Footer />
      </div>
    </AuthProvider>
  );
}

export default App;