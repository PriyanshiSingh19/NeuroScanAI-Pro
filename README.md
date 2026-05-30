🧠 NeuroScanAI Pro – Explainable Brain MRI Analysis using ResNet50, Grad-CAM & Flask

A full-stack AI-powered medical imaging web application that analyzes brain MRI scans using a ResNet50-based deep learning pipeline and generates visual explanations through Grad-CAM. The project combines computer vision, explainable AI (XAI), Flask APIs, and an interactive frontend dashboard to demonstrate modern healthcare AI workflows.

⭐ Key Highlights
Feature	Details
🧠 Deep Learning Framework	PyTorch
🏥 Domain	Medical Imaging
🔍 Explainability	Grad-CAM
🌐 Backend	Flask
🎨 Frontend	HTML, CSS, JavaScript
📊 Data Visualization	Chart.js, Plotly
🖼️ Image Processing	Pillow, OpenCV, NumPy
⚙️ Architecture	ResNet50-Based Classification Pipeline
🔑 Core Concepts

Computer Vision • Medical Imaging • Deep Learning • PyTorch • Flask • Grad-CAM • Explainable AI (XAI) • REST APIs • Frontend Development • Healthcare AI

🎯 Project Objective

Medical AI systems must do more than generate predictions—they must also provide transparency and interpretability.

The objective of NeuroScanAI Pro is to demonstrate how modern deep learning models can be integrated into an interactive web application capable of:

Processing brain MRI scans
Performing deep learning inference
Visualizing model attention using Grad-CAM
Delivering interpretable results through a user-friendly dashboard
Showcasing an end-to-end healthcare AI workflow

This project focuses on engineering and explainability rather than clinical deployment.

✨ Features
🖼️ MRI Image Upload
Upload MRI images directly through the browser
Real-time image preview
Simple and intuitive user experience
🤖 AI Prediction Workflow

The application is structured around a four-class brain tumor classification workflow:

No Tumor
Meningioma
Glioma
Pituitary Tumor

When connected to trained model weights, the system can perform automated MRI analysis and prediction.

📈 Confidence & Risk Assessment

The dashboard displays:

Predicted category
Confidence score
Risk level
Severity indicator
🔍 Explainable AI with Grad-CAM

Grad-CAM generates heatmaps that highlight image regions most influential in the model's prediction process.

Benefits include:

Improved transparency
Better model understanding
Enhanced trust in AI-assisted decision making
📋 AI-Powered Insights

The system includes educational and informational content that provides:

Condition descriptions
Risk information
Suggested next steps
General medical insights
🗂️ Patient History Tracking

The frontend stores previous analyses and allows users to review prediction history directly within the dashboard.

📊 Analytics Dashboard

Interactive visualizations are provided using:

Chart.js
Plotly

The dashboard supports:

Confidence visualizations
Comparative analysis
Performance metric displays
Interactive charts and graphs
🏗️ System Architecture
MRI Image Upload
        ↓
Flask Backend
        ↓
Image Preprocessing
(Resize + Normalization)
        ↓
ResNet50 Inference
        ↓
Prediction Generation
        ↓
Confidence Calculation
        ↓
Grad-CAM Heatmap
        ↓
JSON API Response
        ↓
Interactive Dashboard
🧠 Model Architecture
ResNet50

↓
Linear(2048 → 256)

↓
SELU

↓
Dropout(0.4)

↓
Linear(256 → 4)

↓
LogSoftmax
Architecture Goals
Transfer Learning Foundation
Feature Extraction using ResNet50
Multi-Class Classification
Explainable Predictions via Grad-CAM
🔥 Explainable AI (Grad-CAM)

Grad-CAM is implemented inside:

utils/gradcam.py

The module performs:

Forward hook registration
Backward hook registration
Gradient extraction
Activation extraction
Heatmap computation
Image overlay generation

The resulting visualization highlights areas that contribute most strongly to the model's prediction.

🛠️ Technology Stack
Category	Technology
Backend	Flask
Deep Learning	PyTorch
CNN Architecture	ResNet50
Explainability	Grad-CAM
Frontend	HTML5, CSS3, JavaScript
Visualization	Chart.js, Plotly
Image Processing	Pillow, OpenCV
Numerical Computing	NumPy
API Communication	JSON
📁 Project Structure
NeuroScanAI-Pro/
│
├── app.py
│
├── utils/
│   └── gradcam.py
│
├── static/
│   ├── css/
│   │   └── style.css
│   │
│   └── js/
│       └── script.js
│
├── templates/
│   └── index.html
│
├── dummy.jpg
├── requirements.txt
└── README.md
⚙️ Installation & Setup
Clone Repository
git clone https://github.com/PriyanshiSingh19/NeuroScanAI-Pro.git

cd NeuroScanAI-Pro
Install Dependencies
pip install -r requirements.txt
Run Application
python app.py

Open:

http://127.0.0.1:5000
📊 Current Repository Status
Implemented

✅ Flask Backend

✅ ResNet50-Based Architecture

✅ Grad-CAM Explainability

✅ MRI Image Upload Interface

✅ Prediction API Pipeline

✅ Heatmap Generation

✅ Interactive Dashboard

✅ History Tracking

✅ Data Visualizations

Not Included

❌ Trained Brain Tumor Model Weights

❌ MRI Dataset

❌ Clinical Validation

❌ Verified Medical Performance Metrics

Because trained weights are not included, this repository should currently be viewed as an AI application framework demonstrating explainable medical imaging workflows.

🚀 Future Improvements
Integrate trained brain tumor classification weights
Support DICOM medical imaging files
Database-backed patient records
Docker containerization
Cloud deployment (AWS/GCP/Azure)
Authentication & role-based access
Model monitoring and logging
Real-world evaluation metrics
📝 Resume-Ready Highlights
Explainable Healthcare AI System

Developed a full-stack medical imaging application using Flask and PyTorch, integrating Grad-CAM explainability and interactive dashboards for MRI analysis.

Deep Learning Pipeline Engineering

Implemented a ResNet50-based classification workflow with image preprocessing, confidence estimation, and heatmap generation.

Explainable AI (XAI)

Built a custom Grad-CAM module using forward and backward hooks to visualize model attention and improve interpretability.

Full-Stack Development

Integrated backend AI services with a responsive frontend supporting image upload, visualization, analytics, and history tracking.

🔒 Disclaimer

This project is intended for educational, research, and portfolio purposes only.

It is not a certified medical device and should not be used for clinical diagnosis, treatment, or healthcare decision-making.

Any medical information displayed by the application is provided solely for demonstration purposes.

👩‍💻 About This Project

NeuroScanAI Pro demonstrates practical experience in:

Deep Learning
Computer Vision
Explainable AI (XAI)
Medical Imaging Workflows
Flask Development
Frontend Engineering
AI System Design

The project showcases how machine learning models, explainability techniques, and modern web technologies can be combined to create transparent and user-friendly AI applications.

Built with 🧠 PyTorch, Flask, Grad-CAM, and a passion for explainable healthcare AI.
