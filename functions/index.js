// functions/index.js

// Firebase and Node.js imports
const functions = require("firebase-functions");
const express = require("express");
const axios = require("axios");
const fs = require("fs");
const multer = require("multer");
const os = require("os");

const app = express();
const upload = multer({ dest: os.tmpdir() });

// Your Roboflow API Configuration
const API_KEY = "21FkBVEOQB6O2q5eD9Sc";
const MODEL_ID = "pothole-voxrl/1";
const API_URL = `https://detect.roboflow.com/${MODEL_ID}`;

// This function sends the image to Roboflow
async function predictPothole(imagePath) {
  // DEBUGGING: Log the path received by the function
  console.log(`[DEBUG] predictPothole received imagePath: ${imagePath}`);
  try {
    const imageBuffer = fs.readFileSync(imagePath);
    // DEBUGGING: Log the size of the buffer to confirm the file was read
    console.log(`[DEBUG] Read file into buffer. Size: ${imageBuffer.length} bytes.`);

    const response = await axios({
      method: "POST",
      url: API_URL,
      params: { api_key: API_KEY },
      data: imageBuffer,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    // DEBUGGING: Log the successful response from Roboflow
    console.log("[DEBUG] Received successful response from Roboflow API.");
    return response.data;
  } catch (err) {
    // DEBUGGING: Log any error from the axios call
    console.error("[DEBUG] Error calling Roboflow API:", err.response?.data || err.message);
    throw new Error(err.response?.data?.message || "Error performing prediction.");
  } finally {
    // DEBUGGING: Log before deleting the temporary file
    console.log(`[DEBUG] Cleaning up temporary file: ${imagePath}`);
    fs.unlinkSync(imagePath);
  }
}

// This is your API route
app.post("/predict", upload.single("image"), async (req, res) => {
  // DEBUGGING: Log when the route is hit
  console.log("\n--- [DEBUG] /predict route hit ---");

  if (!req.file) {
    console.error("[DEBUG] Error: req.file is missing. Multer may have failed.");
    return res.status(400).json({ error: "No image file provided." });
  }

  // DEBUGGING: Log the file object received from multer
  console.log("[DEBUG] File received by multer:", req.file);

  try {
    // DEBUGGING: Log right before calling the prediction function
    console.log("[DEBUG] Calling predictPothole function...");
    const result = await predictPothole(req.file.path);

    // DEBUGGING: Log the result before sending the response
    console.log("[DEBUG] predictPothole returned result. Sending JSON response.");
    res.json(result);
  } catch (err) {
    // DEBUGGING: Log the error caught in the route handler
    console.error("[DEBUG] Error in /predict route handler:", err);
    res.status(500).json({ error: err.message });
  }
});

exports.api = functions.https.onRequest(app);