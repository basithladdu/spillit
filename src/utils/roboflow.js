// Roboflow Pothole Detection API Integration
const ROBOFLOW_API_KEY = import.meta.env.VITE_ROBOFLOW_API_KEY;
const ROBOFLOW_MODEL_ENDPOINT = "https://detect.roboflow.com/pothole-voxrl/1";

/**
 * Detect potholes in an image using Roboflow API
 * @param {string} base64Image - Base64 encoded image (with data:image prefix)
 * @returns {Promise<Array>} - Array of pothole predictions
 */
export const detectPotholes = async (base64Image) => {
    if (!ROBOFLOW_API_KEY) {
        throw new Error("Roboflow API key is missing. Set VITE_ROBOFLOW_API_KEY in .env");
    }

    try {
        // Remove data:image/jpeg;base64, prefix if present
        const base64Data = base64Image.split(',')[1] || base64Image;

        const response = await fetch(`${ROBOFLOW_MODEL_ENDPOINT}?api_key=${ROBOFLOW_API_KEY}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: base64Data
        });

        if (!response.ok) {
            throw new Error(`Roboflow API error: ${response.status}`);
        }

        const data = await response.json();
        return data.predictions || [];
    } catch (error) {
        console.error("Roboflow detection error:", error);
        throw error;
    }
};

/**
 * Draw bounding boxes on image canvas
 * @param {string} base64Image - Original image in base64
 * @param {Array} predictions - Roboflow predictions
 * @returns {Promise<string>} - Annotated image in base64
 */
export const drawDetectionsOnCanvas = (base64Image, predictions) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');

            // Draw original image
            ctx.drawImage(img, 0, 0);

            // Draw bounding boxes
            predictions.forEach(pred => {
                const x = pred.x - (pred.width / 2);
                const y = pred.y - (pred.height / 2);

                // Box
                ctx.strokeStyle = '#FF3D00';
                ctx.lineWidth = 4;
                ctx.strokeRect(x, y, pred.width, pred.height);

                // Label background
                ctx.fillStyle = '#FF3D00';
                const text = `${Math.round(pred.confidence * 100)}%`;
                const textWidth = ctx.measureText(text).width;
                ctx.fillRect(x, y - 25, textWidth + 10, 25);

                // Label text
                ctx.fillStyle = '#FFFFFF';
                ctx.font = 'bold 16px Inter';
                ctx.fillText(text, x + 5, y - 5);
            });

            resolve(canvas.toDataURL('image/jpeg', 0.9));
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = base64Image;
    });
};

/**
 * Convert file to base64
 * @param {File} file - Image file
 * @returns {Promise<string>} - Base64 string
 */
export const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });
};
