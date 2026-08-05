import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { MotionConfig } from "framer-motion";
import App from "./App.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import "./index.css";

// Recover once when a user has an old HTML shell that points to a replaced
// lazy chunk after a deployment. Vite exposes this event for that case.
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  const recoveryKey = 'spillit_chunk_recovery';
  try {
    if (sessionStorage.getItem(recoveryKey) === '1') return;
    sessionStorage.setItem(recoveryKey, '1');
  } catch {
    // Storage can be unavailable in restricted browser contexts; avoid a reload loop.
    return;
  }
  window.location.reload();
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <MotionConfig reducedMotion="user">
          <App />
        </MotionConfig>
      </ErrorBoundary>
      <Analytics />
    </BrowserRouter>
  </StrictMode>,
);
