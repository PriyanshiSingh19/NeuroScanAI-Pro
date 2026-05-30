import torch
import torch.nn.functional as F
import cv2
import numpy as np

class GradCAM:
    def __init__(self, model, target_layer):
        self.model = model
        self.target_layer = target_layer
        self.gradients = None
        self.activations = None
        
        # Register hooks
        self.target_layer.register_forward_hook(self.save_activation)
        self.target_layer.register_full_backward_hook(self.save_gradient)
        
    def save_activation(self, module, input, output):
        self.activations = output
        
    def save_gradient(self, module, grad_input, grad_output):
        self.gradients = grad_output[0]
        
    def generate_heatmap(self, input_tensor, target_class=None):
        # We need gradients, so make sure requires_grad is True for input if needed, 
        # or that the model parameters are set correctly.
        # Ensure we are in eval mode but gradients can still flow back to the target layer.
        self.model.eval()
        
        # Forward pass
        output = self.model(input_tensor)
        
        if target_class is None:
            target_class = output.argmax(dim=1).item()
            
        # Backward pass
        self.model.zero_grad()
        # We use output directly if it's logits. If it's LogSoftmax, we can still backward from it, 
        # but backwarding from the exp(output) or just the specific class score is better.
        # Since output is LogSoftmax, we backward from output[0, target_class]
        target = output[0, target_class]
        target.backward(retain_graph=True)
        
        # Get activations and gradients
        gradients = self.gradients.detach().cpu().numpy()[0]
        activations = self.activations.detach().cpu().numpy()[0]
        
        # Pool the gradients across spatial dimensions
        weights = np.mean(gradients, axis=(1, 2))
        
        # Weight the activations
        heatmap = np.zeros(activations.shape[1:], dtype=np.float32)
        for i, w in enumerate(weights):
            heatmap += w * activations[i]
            
        # Apply ReLU to heatmap (we only care about positive influences)
        heatmap = np.maximum(heatmap, 0)
        
        # Normalize heatmap to [0, 1]
        if np.max(heatmap) == 0:
            return np.zeros_like(heatmap)
        heatmap /= np.max(heatmap)
        
        # Resize to input dimensions (224x224)
        heatmap = cv2.resize(heatmap, (input_tensor.shape[3], input_tensor.shape[2]))
        
        return heatmap

def overlay_heatmap(image_bytes, heatmap, alpha=0.5, colormap=cv2.COLORMAP_JET):
    """
    Overlays the heatmap on the original image.
    image_bytes: original image bytes.
    heatmap: 2D numpy array [0, 1]
    """
    # Read image from bytes
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    # Resize image to match heatmap size if needed (usually 224x224)
    # Actually, we should resize heatmap to match original image size for better quality visualization
    img_h, img_w = img.shape[:2]
    heatmap_resized = cv2.resize(heatmap, (img_w, img_h))
    
    # Convert heatmap to uint8 and apply colormap
    heatmap_uint8 = np.uint8(255 * heatmap_resized)
    heatmap_colored = cv2.applyColorMap(heatmap_uint8, colormap)
    
    # Overlay
    superimposed_img = cv2.addWeighted(img, 1 - alpha, heatmap_colored, alpha, 0)
    
    # Convert back to bytes for sending
    _, buffer = cv2.imencode('.jpg', superimposed_img)
    return buffer.tobytes()
