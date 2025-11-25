# Mobile Optimization Plan for Fixit

## 1. Overview
This plan outlines the steps to transform the Fixit React application into a fully responsive, mobile-first experience. The current application relies on fixed positioning and desktop-centric layouts which break on smaller screens.

## 2. Global Styles & Configuration (`src/index.css`)
- **Action:** Add base styles for mobile.
- **Details:**
    - Set `html, body { overflow-x: hidden; }` to prevent horizontal scroll.
    - Define safe-area variables for notched devices.
    - Ensure minimum font size of 16px for inputs to prevent iOS zoom.
    - Add utility classes for hiding scrollbars but keeping functionality.

## 3. Navigation (`src/components/Navbar.jsx`)
- **Current State:** Fixed pill menu that overflows on mobile.
- **Target State:** Responsive Navbar.
- **Implementation:**
    - **Desktop:** Keep existing pill design.
    - **Mobile:**
        - Show a simplified header with Logo and Hamburger button.
        - Implement a full-screen or slide-out menu for navigation links.
        - Move Search and Auth buttons to the mobile menu or keep them accessible in the header if space permits.
    - **Animation:** Use `framer-motion` for smooth menu transitions.

## 4. Home / Map View (`src/pages/Home.jsx`)
- **Current State:**
    - Controls fixed at `bottom-24` and `bottom-8`.
    - Report modal is a centered box `max-w-lg`.
    - Leaflet popups are hardcoded with fixed widths.
- **Target State:**
    - **Controls:** Move to a bottom sheet or stack vertically on the right side with proper spacing from the bottom (accounting for mobile browser bars).
    - **Report Modal:**
        - **Desktop:** Centered modal.
        - **Mobile:** Full-screen modal or slide-up bottom sheet.
    - **Leaflet Popups:** Use CSS classes instead of inline styles for popups to make them responsive (max-width: 80vw).
    - **Interactions:** Ensure touch targets are 44px+.

## 5. Dashboard / Admin View (`src/pages/Dashboard.jsx`)
- **Current State:**
    - Table-based layout for reports.
    - Grid layout for stats.
- **Target State:**
    - **Stats:** Stack vertically on mobile (1 column), 2 columns on tablet, 4 on desktop.
    - **Reports List:**
        - **Desktop:** Table view.
        - **Mobile:** Card view (stacked list of report cards).
    - **Filters:** Collapsible filter section.
    - **Detail Modal:** Full screen on mobile.

## 6. Performance & Best Practices
- **Images:** Ensure `uploadToCloudinary` resizes images if possible (or handle via CSS).
- **Code Splitting:** `App.jsx` already uses `Routes`, but we can add `React.lazy` for pages if bundle size is an issue (optional for now as app seems small).
- **Meta Tags:** Ensure `viewport` is set correctly (user responsibility in `index.html`, but we will verify via code if possible or just assume).

## 7. Execution Order
1.  **Global CSS**: Fix base issues.
2.  **Navbar**: The primary navigation point.
3.  **Home Page**: The main landing and interaction point.
4.  **Dashboard**: The admin interface.
