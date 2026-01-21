# Use Python 3.10 slim image (lightweight)
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies required for OpenCV
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    wget \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (for better caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Create models directory first
RUN mkdir -p models

# Download weights from Google Drive using gdown
# The ID 1vXTyWuvFCy7P0GEvQLYtpcxDi6yqZ9ce is from the user provided link
RUN pip install gdown && \
    gdown --id 1vXTyWuvFCy7P0GEvQLYtpcxDi6yqZ9ce -O pothole_weights.zip && \
    unzip pothole_weights.zip -d temp_weights && \
    # Extract the TINY weights specifically
    find temp_weights -name "yolov4-tiny-pothole_final.weights" -exec mv {} models/yolov4-tiny-pothole.weights \; && \
    # Download the standard tiny cfg suitable for this model (or use your custom one if in zip)
    wget -O models/yolov4-tiny-pothole.cfg https://raw.githubusercontent.com/AlexeyAB/darknet/master/cfg/yolov4-tiny.cfg && \
    rm -rf pothole_weights.zip temp_weights

# Ensure config exists (copied from local source code keying off where we put it locally)
# Since we are in /app/backend effectively during build
COPY models/yolov4-fixed-pothole.cfg models/yolov4-fixed-pothole.cfg

# Copy the rest of the application
COPY . .

# Make sure we use the tiny processor by default
# If video_processor_tiny.py exists, we copy it to video_processor.py for the main entry point
# (Uncomment the next line if you want to force the switch automatically)
# RUN cp video_processor_tiny.py video_processor.py 2>/dev/null || :

# Expose port (Render sets the PORT env var automatically)
ENV PORT=5000
EXPOSE 5000

# Start command
# We use the 'video_processor' module which you should have set up
# Start command with 1 worker to save RAM on Free Tier
CMD gunicorn --bind 0.0.0.0:$PORT --timeout 600 --workers 1 video_processor:app
