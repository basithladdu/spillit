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

# Download YOLOv4-Tiny weights and config if they don't exist
# This ensures they are available even on fresh deployments
RUN if [ ! -f models/yolov4-tiny.weights ]; then \
    wget -O models/yolov4-tiny.weights https://github.com/AlexeyAB/darknet/releases/download/darknet_yolo_v4_pre/yolov4-tiny.weights; \
    fi

RUN if [ ! -f models/yolov4-tiny.cfg ]; then \
    wget -O models/yolov4-tiny.cfg https://raw.githubusercontent.com/AlexeyAB/darknet/master/cfg/yolov4-tiny.cfg; \
    fi

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
