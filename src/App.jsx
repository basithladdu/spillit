import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Team from "./pages/Team";
import NotFound from "./pages/NotFound";
import Report from "./pages/Report";
import Gallery from "./pages/Gallery";
import Help from "./pages/Help";
import Leaderboard from "./pages/Leaderboard";
import SIH2025 from "./pages/SIH2025";

import "./App.css";
import "leaflet/dist/leaflet.css";

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-950 dark:via-black dark:to-gray-800 text-black dark:text-white transition-colors duration-300">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/report/:id" element={<Report />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/help" element={<Help />} />
          <Route path="/leaderboard" element={<Leaderboard />} />

          {/* Team is now public */}
          <Route path="/team" element={<Team />} />
          <Route path="/SIH2025" element={<SIH2025 />} />

          {/* Dashboard remains protected */}
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
        <Footer />
      </div>
    </AuthProvider>
  );
}

export default App;
