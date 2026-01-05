---

### Sketch 2: The Transformer Architecture

```markdown
# The Transformer Architecture: Attention is All You Need

Introduced by Google in 2017, the Transformer architecture revolutionized NLP by abandoning Recurrent Neural Networks (RNNs) in favor of a mechanism called **Self-Attention**. This allows the model to process input data in parallel (unlike RNNs) and capture long-range dependencies effectively.

## 1. The Core Concept: Self-Attention
Self-attention allows the model to look at other words in the input sentence to better understand the context of the current word.

It operates on three vectors derived from the input embedding:
1.  **Query ($Q$):** What I am looking for?
2.  **Key ($K$):** What do I have to offer?
3.  **Value ($V$):** What represents me?

The attention score determines how much focus to place on other parts of the input:

$$ \text{Attention}(Q, K, V) = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)V $$

## 2. Multi-Head Attention
Instead of performing a single attention function, Transformers project the queries, keys, and values $h$ times with different learned linear projections. This allows the model to focus on different positions and semantic subspaces simultaneously.

## 3. Positional Encoding
Since Transformers process tokens in parallel, they have no inherent sense of order (unlike RNNs). Positional Encodings are vectors added to the input embeddings to provide information about the relative or absolute position of the tokens in the sequence.

## 4. Encoder-Decoder Structure
*   **Encoder (e.g., BERT):** Processes the input sequence. Good for classification and understanding tasks.
*   **Decoder (e.g., GPT):** Generates the output sequence. Uses "Masked" attention so it cannot see future tokens. Good for text generation.

## Code Example: Scaled Dot-Product Attention Implementation

```python
import numpy as np
import torch
import torch.nn.functional as F

def scaled_dot_product_attention(query, key, value, mask=None):
    """
    Computes the scaled dot-product attention.
    Args:
        query: Tensor of shape (batch, num_heads, seq_len_q, d_k)
        key: Tensor of shape (batch, num_heads, seq_len_k, d_k)
        value: Tensor of shape (batch, num_heads, seq_len_v, d_v)
        mask: Optional mask to prevent attention to certain positions
    """
    d_k = query.size(-1)
    
    # 1. Matmul Q and K_transpose
    scores = torch.matmul(query, key.transpose(-2, -1)) 
    
    # 2. Scale by sqrt(d_k)
    scores = scores / np.sqrt(d_k)
    
    # 3. Apply Mask (optional)
    if mask is not None:
        scores = scores.masked_fill(mask == 0, -1e9)
    
    # 4. Softmax to get probabilities
    attention_weights = F.softmax(scores, dim=-1)
    
    # 5. Multiply by Values
    output = torch.matmul(attention_weights, value)
    
    return output, attention_weights

# Example Usage
d_model = 512
head_dim = 64
seq_len = 10
batch_size = 1

# Random inputs representing embeddings projected to Q, K, V
Q = torch.randn(batch_size, 1, seq_len, head_dim)
K = torch.randn(batch_size, 1, seq_len, head_dim)
V = torch.randn(batch_size, 1, seq_len, head_dim)

output, weights = scaled_dot_product_attention(Q, K, V)
print(f"Output Shape: {output.shape}") # [1, 1, 10, 64]