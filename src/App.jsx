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
  <div className="flex items-center justify-center min-h-screen bg-[#08080c]">
    <div className="w-8 h-8 rounded-full border-2 border-[#ff7ec9]/30 border-t-[#ff7ec9] animate-spin" />
  </div>
);

function App() {

  return (
    <AuthProvider>
      <div className="min-h-screen bg-[#08080c] text-white flex flex-col">
        <Navbar />

        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Full-screen map — no pt-16, no flex wrapper, no Footer */}
            <Route path="/" element={<Home />} />

            {/* All other pages get the standard padded content wrapper + Footer */}
            <Route path="/*" element={
              <>
                <div className="flex-1 pt-16">
                  <Routes>
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
                </div>
                <Footer />
              </>
            } />
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
          theme="light"
        />
      </div>
    </AuthProvider>
  );
}

export default App;