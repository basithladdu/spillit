# Mapbox Setup Guide

## Quick Start

To use the map features in this application, you need a Mapbox access token.

### Step 1: Create a Mapbox Account

1. Go to [https://account.mapbox.com/auth/signup/](https://account.mapbox.com/auth/signup/)
2. Sign up for a free account (no credit card required for the free tier)

### Step 2: Get Your Access Token

1. After signing in, go to [https://account.mapbox.com/access-tokens/](https://account.mapbox.com/access-tokens/)
2. You'll see a "Default public token" - this is what you need
3. Click the copy icon to copy the token

### Step 3: Add Token to Your Project

1. Create a `.env` file in the project root (same directory as `package.json`)
2. Add this line to the file:
   ```
   VITE_MAPBOX_TOKEN=pk.eyJ1IjoieW91ci11c2VybmFtZSIsImEiOiJ5b3VyLXRva2VuIn0.your-signature
   ```
3. Replace the token with your actual token from Mapbox

### Step 4: Restart the Dev Server

If the dev server is already running, stop it (Ctrl+C) and restart:

```bash
npm run dev
```

## Map Styles Used

- **Light Mode**: `mapbox://styles/mapbox/streets-v12` (Google Maps-like)
- **Dark Mode**: `mapbox://styles/mapbox/dark-v11`

## Free Tier Limits

The Mapbox free tier includes:
- 50,000 map loads per month
- Unlimited map views (once loaded)
- All map styles
- Geocoding API (100,000 requests/month)

This is more than enough for development and small-scale production use.

## Troubleshooting

### Map Not Showing

1. **Check your token**: Make sure the `.env` file exists and has the correct token
2. **Restart dev server**: Environment variables are only loaded on startup
3. **Check browser console**: Look for Mapbox-related errors
4. **Verify token**: Go to Mapbox dashboard and ensure the token is active

### Token Not Working

1. Make sure the token starts with `pk.` (public token)
2. Check that there are no extra spaces in the `.env` file
3. Verify the token hasn't been deleted or restricted in your Mapbox account

### Map Loads But Shows "Unauthorized"

This usually means:
- The token is invalid or expired
- The token has URL restrictions that don't include `localhost`
- You need to create a new token

## Custom Map Styles (Optional)

If you want to use a custom map style:

1. Create a custom style in [Mapbox Studio](https://studio.mapbox.com/)
2. Copy the style URL (looks like `mapbox://styles/username/style-id`)
3. Update `DashboardMap.jsx` to use your custom style URL

## Security Notes

- ✅ Public tokens (starting with `pk.`) are safe to use in client-side code
- ✅ The `.env` file is in `.gitignore` to prevent accidental commits
- ✅ Never commit your `.env` file to version control
- ✅ For production, consider adding URL restrictions to your token in the Mapbox dashboard
