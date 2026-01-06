# Deep Learning Fundamentals: From Perceptrons to Backpropagation

Deep Learning is a subset of Machine Learning based on Artificial Neural Networks (ANNs) with representation learning. Unlike traditional algorithms that require manual feature extraction, deep learning models learn high-level features from data in an incremental manner.

## 1. The Building Block: The Neuron (Perceptron)
An artificial neuron mimics a biological neuron. It receives inputs ($x$), multiplies them by specific weights ($w$), adds a bias ($b$), and passes the result through an activation function ($f$).

$$ y = f(\sum (w_i \cdot x_i) + b) $$

## 2. Activation Functions
Activation functions introduce non-linearity, allowing the network to learn complex patterns. Without them, a neural network is just linear regression.

*   **Sigmoid:** Squashes numbers to range $[0, 1]$. Good for binary classification output, but suffers from the "vanishing gradient" problem in deep layers.
*   **ReLU (Rectified Linear Unit):** $f(x) = \max(0, x)$. The standard for hidden layers. It is computationally efficient and mitigates vanishing gradients.
*   **Softmax:** Converts a vector of numbers into a probability distribution. Used for multi-class classification output.

## 3. The Learning Process
1.  **Forward Pass:** Data flows from input to output. The model makes a prediction.
2.  **Loss Function:** Calculates the error between the prediction and the actual target (e.g., Mean Squared Error or Cross-Entropy Loss).
3.  **Backpropagation:** The core algorithm. It calculates the gradient of the loss function with respect to each weight by applying the Chain Rule of Calculus backward from the output layer to the input layer.
4.  **Optimizer (Gradient Descent):** Updates the weights to minimize the loss.

## Code Example: A Simple Neural Network in PyTorch

```python
import torch
import torch.nn as nn
import torch.optim as optim

# Define a simple Feed-Forward Network
class SimpleNet(nn.Module):
    def __init__(self, input_size, hidden_size, num_classes):
        super(SimpleNet, self).__init__()
        self.fc1 = nn.Linear(input_size, hidden_size)  # Input -> Hidden
        self.relu = nn.ReLU()                          # Activation
        self.fc2 = nn.Linear(hidden_size, num_classes) # Hidden -> Output
    
    def forward(self, x):
        out = self.fc1(x)
        out = self.relu(out)
        out = self.fc2(out)
        return out

# Hyperparameters
input_size = 784  # Example: 28x28 images flattened
hidden_size = 128
num_classes = 10
learning_rate = 0.001

# Model, Loss, Optimizer
model = SimpleNet(input_size, hidden_size, num_classes)
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=learning_rate)

# Dummy Training Loop
inputs = torch.randn(64, input_size)  # Batch of 64
labels = torch.randint(0, num_classes, (64,))

# Forward pass
outputs = model(inputs)
loss = criterion(outputs, labels)

# Backward pass and optimization
optimizer.zero_grad() # Clear previous gradients
loss.backward()       # Compute new gradients
optimizer.step()      # Update weights

print(f"Loss: {loss.item():.4f}")