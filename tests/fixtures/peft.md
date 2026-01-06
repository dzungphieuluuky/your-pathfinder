---

### Sketch 5: Parameter-Efficient Fine-Tuning (PEFT)

```markdown
# Parameter-Efficient Fine-Tuning (PEFT): LoRA and QLoRA

As models grow larger (LLMs like Llama 3 or Falcon), fine-tuning all parameters becomes computationally impossible for most users. Full fine-tuning requires storing the model weights + gradients + optimizer states, often demanding hundreds of GBs of VRAM.

## 1. What is PEFT?
PEFT techniques freeze the pre-trained model's main weights and only train a small number of extra parameters (adapters). This drastically reduces memory usage and storage requirements.

## 2. LoRA (Low-Rank Adaptation)
LoRA injects trainable rank decomposition matrices into each layer of the Transformer architecture.
Instead of updating the full weight matrix $W$, we learn two smaller matrices $A$ and $B$ such that $\Delta W = B \times A$.
*   If $W$ is $d \times d$, $A$ is $r \times d$ and $B$ is $d \times r$.
*   Rank $r$ is very small (e.g., 8 or 16).
*   **Result:** We train <1% of the total parameters but achieve comparable performance to full fine-tuning.

## 3. QLoRA (Quantized LoRA)
QLoRA takes it a step further by loading the base model in 4-bit precision (NormalFloat4) and training LoRA adapters on top. This allows fine-tuning a 70B parameter model on a single high-end consumer GPU (e.g., RTX 3090/4090).

## Code Example: Using LoRA with Hugging Face PEFT

```python
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import get_peft_model, LoraConfig, TaskType

# 1. Load Base Model (e.g., GPT-2 for demonstration)
model_name = "gpt2"
model = AutoModelForCausalLM.from_pretrained(model_name)
tokenizer = AutoTokenizer.from_pretrained(model_name)

# 2. Define LoRA Configuration
peft_config = LoraConfig(
    task_type=TaskType.CAUSAL_LM, 
    inference_mode=False, 
    r=8,            # Rank
    lora_alpha=32,  # Scaling factor
    lora_dropout=0.1
)

# 3. Wrap Model with PEFT
# This freezes base weights and adds trainable LoRA layers
peft_model = get_peft_model(model, peft_config)

# 4. Verify Trainable Parameters
def print_trainable_parameters(model):
    trainable_params = 0
    all_param = 0
    for _, param in model.named_parameters():
        all_param += param.numel()
        if param.requires_grad:
            trainable_params += param.numel()
    
    print(
        f"trainable params: {trainable_params} || "
        f"all params: {all_param} || "
        f"trainable%: {100 * trainable_params / all_param:.2f}"
    )

print_trainable_parameters(peft_model)

# The model is now ready for standard Hugging Face Trainer loop...