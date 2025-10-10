// server.js

// 1. All imports at the top
const express = require("express");
const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");
const multer = require("multer");

// 2. Setup multer for file uploads
const upload = multer({ dest: "uploads/" }); // Files will be temporarily stored in an 'uploads' folder
const app = express();

// 3. Roboflow API Configuration
const API_KEY = "21FkBVEOQB6O2q5eD9Sc"; // Your Roboflow API Key
const MODEL_ID = "pothole-voxrl/1";
const API_URL = `https://detect.roboflow.com/${MODEL_ID}`; // Use the correct detect URL

/**
 * Sends an image to the Roboflow API and returns the prediction.
 * @param {string} imagePath - The path to the image file.
 * @returns {Promise<object>} The prediction data from Roboflow.
 */
async function predictPothole(imagePath) {
  try {
    // Read image as a Buffer
    const imageBuffer = fs.readFileSync(imagePath);

    // Prepare the request for Roboflow
    const response = await axios({
      method: "POST",
      url: API_URL,
      params: {
        api_key: API_KEY
      },
      data: imageBuffer,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    });
    
    // CHANGE 1: Return the prediction data instead of logging it
    return response.data;

  } catch (err) {
    // Re-throw the error to be caught by the route handler
    console.error("Error during inference:", err.response?.data || err.message);
    throw new Error(err.response?.data?.message || "Error performing prediction.");
  } finally {
    // Clean up the uploaded file after prediction
    fs.unlinkSync(imagePath);
  }
}

// 4. Define the Express route for prediction
app.post("/predict", upload.single("image"), async (req, res) => {
  // The 'image' in upload.single('image') must match the form field name
  if (!req.file) {
    return res.status(400).json({ error: "No image file provided." });
  }

  try {
    const imagePath = req.file.path;
    // Call the function and wait for the result
    const result = await predictPothole(imagePath);
    
    // CHANGE 2: Send the result back to the client
    res.json(result);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});