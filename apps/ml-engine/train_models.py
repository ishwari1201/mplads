import os
import pickle
import numpy as np
from sklearn.ensemble import IsolationForest

try:
    import torch
    import torch.nn as nn
    import torch.optim as optim
    from app.models.deep_cnn_model import DeepConvSiteNet, HAS_TORCH
except ImportError:
    HAS_TORCH = False


def train_isolation_forest():
    """
    Trains and saves pretrained weights for Isolation Forest Anomaly Model.
    """
    print("🤖 Training Isolation Forest Anomaly Detector...")
    
    # Generate 1,000 synthetic baseline work samples (Sanctioned Cost, Sector ID, Utilization Rate, Divergence Delta)
    np.random.seed(42)
    normal_works = np.random.normal(loc=[2500000.0, 3, 0.75, 5.0], scale=[500000.0, 1, 0.10, 3.0], size=(950, 4))
    anomalous_works = np.random.uniform(low=[15000000.0, 1, 0.95, 45.0], high=[50000000.0, 5, 0.99, 65.0], size=(50, 4))
    
    dataset = np.vstack([normal_works, anomalous_works])
    
    clf = IsolationForest(n_estimators=100, contamination=0.05, random_state=42)
    clf.fit(dataset)
    
    os.makedirs("app/models/weights", exist_ok=True)
    weight_path = "app/models/weights/isolation_forest.pkl"
    with open(weight_path, "wb") as f:
        pickle.dump(clf, f)
        
    print(f"✅ Isolation Forest trained and saved to {weight_path}")


def train_deep_convnet():
    """
    Trains and saves PyTorch Deep ConvNet weights for Construction Site Image Classification.
    """
    print("🧠 Training Deep Convolutional Neural Network (Deep ConvNet)...")
    
    if not HAS_TORCH:
        print("⚠️ PyTorch not installed in environment, skipping PyTorch weight export.")
        return

    model = DeepConvSiteNet(num_classes=4)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)

    # Synthetic training loop over 5 epochs
    model.train()
    for epoch in range(1, 6):
        dummy_images = torch.randn(16, 3, 224, 224)
        dummy_labels = torch.randint(0, 4, (16,))
        
        optimizer.zero_grad()
        outputs = model(dummy_images)
        loss = criterion(outputs, dummy_labels)
        loss.backward()
        optimizer.step()
        
        print(f"Epoch [{epoch}/5], Loss: {loss.item():.4f}")

    os.makedirs("app/models/weights", exist_ok=True)
    weights_path = "app/models/weights/deep_cnn_weights.pth"
    torch.save(model.state_state_dict() if hasattr(model, 'state_state_dict') else model.state_dict(), weights_path)
    print(f"✅ Deep ConvNet trained and saved to {weights_path}")


if __name__ == "__main__":
    train_isolation_forest()
    train_deep_convnet()
