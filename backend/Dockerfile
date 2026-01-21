# Use Python 3.10 slim image (lightweight)
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies required for OpenCV
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (for better caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Create necessary directories for model files
RUN mkdir -p models

# Models are copied from local directory via COPY . . below
# We assume models/yolov4-fixed-pothole.weights exists locally

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
CMD gunicorn --bind 0.0.0.0:$PORT --timeout 600 --workers 2 video_processor:app
