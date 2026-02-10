import os
import uuid
import json
import random
from flask import Flask, request, jsonify, send_from_directory, url_for
from flask_cors import CORS
from pdf2image import convert_from_bytes

app = Flask(__name__)

# STATIC_FOLDER configuration
# STATIC_FOLDER configuration
STATIC_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static')
app.config['STATIC_FOLDER'] = STATIC_FOLDER

# Ensure static folder exists
if not os.path.exists(STATIC_FOLDER):
    os.makedirs(STATIC_FOLDER)

# Configure CORS
# Allow requests from http://localhost:3000, https://localhost:3000, and http://localhost:5173
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:3000", "https://localhost:3000", "http://localhost:5173"]}})

def generate_mock_ocr_data(width, height):
    """Generates mock OCR text and bounding boxes."""
    mock_data = []
    # Generate a few random words with bboxes
    words = ["INVOICE", "Total", "Amount", "Date", "123.45", "2023-10-27", "Vendor", "Client"]
    for _ in range(random.randint(5, 10)):
        word = random.choice(words)
        # Random bbox within image dimensions
        x1 = random.randint(0, width - 100)
        y1 = random.randint(0, height - 50)
        x2 = x1 + random.randint(50, 100)
        y2 = y1 + random.randint(20, 50)
        
        # Ensure bbox is within bounds
        x2 = min(x2, width)
        y2 = min(y2, height)
        
        mock_data.append({
            "text": word,
            "bbox": [x1, y1, x2, y2] # [left, top, right, bottom]
        })
    return mock_data

@app.route('/api/ocr', methods=['POST'])
def upload_pdf():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if file:
        try:
            # Convert PDF to images
            # Use local poppler_bin
            POPPLER_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'poppler_bin')
            images = convert_from_bytes(file.read(), poppler_path=POPPLER_PATH)
            
            results = []
            
            for i, image in enumerate(images):
                # Generate unique filename
                filename = f"{uuid.uuid4()}_{i}.png"
                filepath = os.path.join(app.config['STATIC_FOLDER'], filename)
                
                # Save image
                image.save(filepath, 'PNG')
                
                # Get dimensions
                width, height = image.size
                
                # Generate full URL
                # external=True generates absolute URL (http://localhost:5000/static/...)
                file_url = url_for('serve_static', filename=filename, _external=True)
                
                # Generate mock OCR data
                ocr_data = generate_mock_ocr_data(width, height)
                
                results.append({
                    "page_number": i + 1,
                    "image_url": file_url,
                    "width": width,
                    "height": height,
                    "ocr_data": ocr_data
                })
                
            return jsonify({"results": results}), 200

        except Exception as e:
            return jsonify({"error": str(e)}), 500

@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory(app.config['STATIC_FOLDER'], filename)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
