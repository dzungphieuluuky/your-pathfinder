---

### Sketch 3: The Hugging Face Ecosystem

```markdown
# The Hugging Face Ecosystem: Democratizing AI

Hugging Face has become the "GitHub of Machine Learning." It provides a suite of libraries and a central hub that standardizes how developers download, train, and deploy Transformer-based models.

## 1. The Model Hub
A central repository hosting hundreds of thousands of pre-trained models (BERT, GPT, T5, Llama, Whisper) for tasks ranging from Text Classification and Summarization to Audio Transcription and Image Generation.

## 2. The `transformers` Library
The de facto standard library for NLP. It abstracts away the complexity of PyTorch or TensorFlow, providing a unified API to load models and tokenizers.

*   **Tokenizer:** Converts raw text into numbers (Input IDs) that the model understands. Handles vocabulary and special tokens (CLS, SEP).
*   **Model:** The neural network architecture.
*   **Config:** Defines model hyperparameters.

## 3. The `datasets` Library
A library designed for processing huge datasets efficiently. It uses memory-mapping (via Apache Arrow) to process datasets larger than RAM and provides one-line commands to download benchmarks like SQuAD or GLUE.

## 4. The Pipeline API
The highest-level API, designed for inference. It handles preprocessing, model inference, and post-processing in a single call.

## Code Example: Sentiment Analysis with Hugging Face

```python
from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification

# 1. Quick Inference using Pipeline
classifier = pipeline("sentiment-analysis")
result = classifier("I absolutely love using Hugging Face libraries!")
print(f"Pipeline Result: {result}")

# 2. Manual Control (Under the hood of pipeline)
model_name = "distilbert-base-uncased-finetuned-sst-2-english"

# Load Tokenizer and Model
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSequenceClassification.from_pretrained(model_name)

# Preprocess
text = "The learning curve is steep but rewarding."
inputs = tokenizer(text, return_tensors="pt") # Return PyTorch tensors

# Inference
outputs = model(**inputs)
logits = outputs.logits

# Post-process
import torch
probabilities = torch.softmax(logits, dim=1)
predicted_class = torch.argmax(probabilities).item()

print(f"Logits: {logits}")
print(f"Predicted Class ID: {predicted_class}")