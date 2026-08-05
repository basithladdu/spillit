import { Suspense, lazy, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { AuthProvider } from "./hooks/useAuth";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import { PageSpinner } from "./components/UI/PageStatus";
import "./App.css";

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
const Profile = lazy(() => import("./pages/Profile"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

const PageLoader = () => <PageSpinner label="Loading page" />;

function RouteTitle() {
  const { pathname } = useLocation();
  const titles = [
    [/^\/$/, 'Spill It — Map Your Memories Anonymously'],
    [/^\/login$/, 'Log in — Spill It'],
    [/^\/register$/, 'Create an account — Spill It'],
    [/^\/reset-password$/, 'Reset password — Spill It'],
    [/^\/gallery$/, 'Memory gallery — Spill It'],
    [/^\/leaderboard$/, 'Hall of fame — Spill It'],
    [/^\/about$/, 'About — Spill It'],
    [/^\/help$/, 'Help — Spill It'],
    [/^\/dashboard$/, 'Operations dashboard — Spill It'],
    [/^\/profile$/, 'Your profile — Spill It'],
    [/^\/memory\//, 'Memory detail — Spill It'],
  ];
  const title = titles.find(([pattern]) => pattern.test(pathname))?.[1] ?? 'Spill It — Anonymous memories';

  const descriptions = [
    [/^\/$/, 'Pin a memory to the place where it happened, share it anonymously, and discover what others felt there.'],
    [/^\/gallery$/, 'Browse anonymous memories, places, and moments shared on the Spill It map.'],
    [/^\/leaderboard$/, 'Explore the most loved anonymous memories shared on Spill It.'],
    [/^\/about$/, 'Learn about Spill It, an anonymous map for memories, stories, and moments.'],
    [/^\/help$/, 'Find answers about posting memories, anonymity, locations, and community guidelines on Spill It.'],
    [/^\/(login|register|reset-password)$/, 'Join Spill It to manage your anonymous memories and discover moments on the map.'],
  ];
  const description = descriptions.find(([pattern]) => pattern.test(pathname))?.[1]
    ?? 'Spill It is a location-based memory sharing app for anonymous stories and moments.';
  const displayTitle = title
    .replace(/\u00e2\u20ac\u201d/g, '—')
    .replace(/\u00e2\u20ac\u2122/g, '’');

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.title = displayTitle;
    const robotsTag = document.querySelector('meta[name="robots"]');
    const isPrivateRoute = /^\/(dashboard|profile|login|register|reset-password)(\/|$)/.test(pathname);
    robotsTag?.setAttribute('content', isPrivateRoute ? 'noindex, nofollow' : 'index, follow');
    const descriptionTag = document.querySelector('meta[name="description"]');
    descriptionTag?.setAttribute('content', description);
    const canonicalTag = document.querySelector('link[rel="canonical"]');
    const canonicalPath = pathname === '/' ? '/' : pathname.replace(/\/$/, '');
    const canonicalUrl = `https://spillit.app${canonicalPath}`;
    canonicalTag?.setAttribute('href', canonicalUrl);
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', title);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', description);
    document.querySelector('meta[property="og:url"]')?.setAttribute('content', canonicalUrl);
    document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', title);
    document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', description);
  }, [description, displayTitle, pathname, title]);

  return <span className="sr-only" aria-live="polite" aria-atomic="true">{displayTitle}</span>;
}

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <RouteTitle />
        <a
          href="#main-content"
          className="fixed left-4 top-4 z-[2000] -translate-y-24 rounded-full border-2 border-foreground bg-accent px-5 py-3 text-sm font-black text-white shadow-pop transition-transform focus:translate-y-0 focus:outline-none focus:ring-4 focus:ring-accent/40"
        >
          Skip to main content
        </a>
        <Navbar />

        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Full-screen map — no pt-16, no flex wrapper, no Footer */}
            <Route path="/" element={<Home />} />

            {/* All other pages get the standard padded content wrapper + Footer */}
            <Route path="/*" element={
              <>
                <div id="main-content" tabIndex="-1" className="flex-1 pt-16 outline-none">
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/memory/:id" element={<MemoryDetail />} />
                    <Route path="/gallery" element={<Gallery />} />
                    <Route path="/help" element={<Help />} />
                    <Route path="/leaderboard" element={<Leaderboard />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </div>
                <Footer />
              </>
            } />
          </Routes>
        </Suspense>

        <ToastContainer
          role="alert"
          ariaLabel="Spill It notifications"
          limit={3}
          position="bottom-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          closeOnEscape
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
