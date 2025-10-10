// src/hooks/usePotholeDetection.jsx
import { useState, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';

// Straight up link to a pre-trained pothole model hosted on Roboflow
const MODEL_URL = 'https://raw.githubusercontent.com/roboflow-ai/pothole-segmentation-dataset/main/potholes.v1-potholes.tfjs/model.json';

export const usePotholeDetection = () => {
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState({ isLoading: true, message: 'Loading model...' });

  // Load the model once
  useEffect(() => {
    tf.ready().then(async () => {
      try {
        const loadedModel = await tf.loadGraphModel(MODEL_URL);
        setModel(loadedModel);
        setLoading({ isLoading: false, message: '' });
      } catch (error) {
        console.error("Model loading failed:", error);
        setLoading({ isLoading: false, message: 'Failed to load model.' });
      }
    });
  }, []);

  const detectPotholes = async (imageElement) => {
    if (!model) return [];

    setLoading({ isLoading: true, message: 'Analyzing image...' });

    // Prepare image tensor
    const tf_img = tf.browser.fromPixels(imageElement);
    const ready_img = tf.image.resizeBilinear(tf_img, [640, 640]).div(255.0).expandDims(0);

    // Run detection
    const predictions = await model.executeAsync(ready_img);
    
    // Process results
    const [boxes, scores, classes, numDetections] = predictions;
    const boxes_data = boxes.dataSync();
    const scores_data = scores.dataSync();
    
    const detectionResults = [];
    const confidenceThreshold = 0.5; // 50% confidence

    for (let i = 0; i < scores_data.length; ++i) {
      if (scores_data[i] > confidenceThreshold) {
        const [ymin, xmin, ymax, xmax] = [boxes_data[i * 4], boxes_data[i * 4 + 1], boxes_data[i * 4 + 2], boxes_data[i * 4 + 3]];
        detectionResults.push({
          box: [xmin, ymin, xmax - xmin, ymax - ymin], // [x, y, width, height]
          score: scores_data[i],
        });
      }
    }

    // Clean up memory
    tf_img.dispose();
    ready_img.dispose();
    predictions.forEach(tensor => tensor.dispose());
    
    setLoading({ isLoading: false, message: `Found ${detectionResults.length} potholes.` });
    return detectionResults;
  };

  return { model, loading, detectPotholes };
};