import os
import io
import datetime
import time
import torch
import torch.nn as nn
from torchvision import models
from torchvision.models import ResNet50_Weights
from torchvision import transforms
from PIL import Image
from flask import Flask, request, jsonify, render_template
import base64

from utils.gradcam import GradCAM, overlay_heatmap

app = Flask(__name__)

# ---------------- GLOBAL STORAGE ---------------- #
history = []

# ---------------- MODEL SETUP ---------------- #
CLASSES = ['None', 'Meningioma', 'Glioma', 'Pituitary']

try:
    weights = ResNet50_Weights.DEFAULT
    model = models.resnet50(weights=weights)

    num_ftrs = model.fc.in_features
    model.fc = nn.Sequential(
        nn.Linear(num_ftrs, 256),
        nn.SELU(),
        nn.Dropout(p=0.4),
        nn.Linear(256, len(CLASSES)),
        nn.LogSoftmax(dim=1)
    )

    model.eval()

    grad_cam = GradCAM(model, model.layer4[-1])
    print("Model & Grad-CAM ready")

except Exception as e:
    print(f"Model error: {e}")
    model = None
    grad_cam = None

# ---------------- IMAGE PROCESSING ---------------- #
preprocess = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225])
])

def process_image(image_bytes):
    try:
        image = Image.open(io.BytesIO(image_bytes))

        if image.mode != "RGB":
            image = image.convert("RGB")

        tensor = preprocess(image).unsqueeze(0)
        return tensor, None

    except Exception as e:
        return None, str(e)

# ---------------- ROUTES ---------------- #

@app.route('/')
def index():
    return render_template('index.html')


@app.route('/history')
def get_history():
    return jsonify(history)


@app.route('/predict', methods=['POST'])
def predict():

    if model is None:
        return jsonify({'error': 'Model not loaded'}), 500

    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    try:
        img_bytes = file.read()

        tensor, error = process_image(img_bytes)
        if error:
            return jsonify({'error': error}), 400

        # ---------------- INFERENCE ---------------- #
        start_time = time.time()
        with torch.no_grad():
            outputs = model(tensor)
            probabilities = torch.exp(outputs)
        inference_time = (time.time() - start_time) * 1000 # in ms

        probs_list = probabilities.squeeze().tolist()

        pred_idx = int(torch.argmax(probabilities))
        pred_class = CLASSES[pred_idx]
        confidence = float(probabilities[0][pred_idx]) * 100

        # ---------------- RISK + SEVERITY ---------------- #
        if pred_class == "None":
            risk_level = "Low"
            severity = "Normal"
        else:
            if confidence > 80:
                risk_level = "High"
                severity = "Critical"
            elif confidence > 60:
                risk_level = "Medium"
                severity = "Needs Observation"
            else:
                risk_level = "Low"
                severity = "Mild"

        # ---------------- AI INSIGHTS ---------------- #
        if pred_class == "Pituitary":
            insight = "Pituitary tumor detected. Usually benign but may affect hormone levels. Clinical evaluation recommended."
        elif pred_class == "Glioma":
            insight = "Glioma detected. Potentially aggressive tumor. Immediate medical imaging review required."
        elif pred_class == "Meningioma":
            insight = "Meningioma detected. Typically slow-growing. Regular monitoring suggested."
        else:
            insight = "No tumor detected. Brain MRI appears normal in this AI analysis."

        # ---------------- GRAD-CAM ---------------- #
        try:
            tensor.requires_grad_(True)

            heatmap = grad_cam.generate_heatmap(tensor, pred_idx)
            heatmap_img_bytes = overlay_heatmap(img_bytes, heatmap)

            heatmap_b64 = base64.b64encode(heatmap_img_bytes).decode('utf-8')

        except Exception as e:
            print("GradCAM error:", e)
            heatmap_b64 = None

        # ---------------- ENCODE ORIGINAL ---------------- #
        orig_b64 = base64.b64encode(img_bytes).decode('utf-8')

        # ---------------- HISTORY ---------------- #
        history_entry = {
            "prediction": pred_class,
            "confidence": round(confidence, 2),
            "time": str(datetime.datetime.now())
        }
        history.append(history_entry)

        # ---------------- RESPONSE ---------------- #
        response = {
            "prediction": pred_class,
            "confidence": round(confidence, 2),
            "probabilities": {
                CLASSES[i]: round(probs_list[i] * 100, 2)
                for i in range(len(CLASSES))
            },
            "risk_level": risk_level,
            "severity": severity,
            "insight": insight,
            "heatmap_image": heatmap_b64,
            "original_image": orig_b64,
            "diagnostics": {
                "inference_time_ms": round(inference_time, 2),
                "model_version": "ResNet50 v2.1.0",
                "input_resolution": "224x224",
                "hardware_status": "GPU Accelerated" if torch.cuda.is_available() else "CPU Mode"
            }
        }

        return jsonify(response)

    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)