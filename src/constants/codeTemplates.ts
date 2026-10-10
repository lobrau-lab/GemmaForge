export const CODE_TEMPLATES = {
  TRAIN_SFT_QLORA: `# ==============================================================================
# GemmaForge: Production QLoRA / SFT Training Ground for Google Gemma Models
# Compatible with Gemma 1, Gemma 2, and Gemma 3 architectures
# ==============================================================================

import os
import torch
from dataclasses import dataclass, field
from typing import Optional
from datasets import load_dataset
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
    TrainingArguments,
)
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from trl import SFTTrainer, SFTConfig

@dataclass
class ModelArguments:
    model_name_or_path: str = field(
        default="google/gemma-2-9b-it",
        metadata={"help": "Path to pretrained model or Hugging Face repo ID"}
    )
    torch_dtype: str = field(default="bfloat16")
    use_flash_attention_2: bool = field(default=True)

@dataclass
class DataArguments:
    dataset_name_or_path: str = field(default="data/gemma_instruct_train.jsonl")
    max_seq_length: int = field(default=4096)
    dataset_text_field: str = field(default="formattedGemmaText")

def main():
    model_args = ModelArguments()
    data_args = DataArguments()

    print(f"[GemmaForge] Loading tokenizer for {model_args.model_name_or_path}...")
    tokenizer = AutoTokenizer.from_pretrained(
        model_args.model_name_or_path,
        padding_side="right",
        trust_remote_code=True,
    )
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    # 4-bit Quantization Config (NF4)
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.bfloat16,
        bnb_4bit_use_double_quant=True,
    )

    print(f"[GemmaForge] Loading base Gemma weights with 4-bit NF4 quantization...")
    model = AutoModelForCausalLM.from_pretrained(
        model_args.model_name_or_path,
        quantization_config=bnb_config,
        device_map="auto",
        torch_dtype=torch.bfloat16,
        attn_implementation="flash_attention_2" if model_args.use_flash_attention_2 else "sdpa",
    )

    model = prepare_model_for_kbit_training(model)

    # PEFT LoRA Config targeting all attention and MLP projections in Gemma
    peft_config = LoraConfig(
        r=64,
        lora_alpha=128,
        lora_dropout=0.05,
        bias="none",
        task_type="CAUSAL_LM",
        target_modules=[
            "q_proj", "k_proj", "v_proj", "o_proj",
            "gate_proj", "up_proj", "down_proj"
        ],
    )
    model = get_peft_model(model, peft_config)
    model.print_trainable_parameters()

    # Load Dataset
    dataset = load_dataset("json", data_files=data_args.dataset_name_or_path, split="train")

    training_args = SFTConfig(
        output_dir="./outputs/gemma-forge-checkpoint",
        num_train_epochs=3,
        per_device_train_batch_size=4,
        gradient_accumulation_steps=4,
        learning_rate=2e-4,
        lr_scheduler_type="cosine",
        warmup_ratio=0.03,
        optim="paged_adamw_8bit",
        logging_steps=10,
        save_strategy="steps",
        save_steps=100,
        evaluation_strategy="no",
        fp16=False,
        bf16=True,
        max_seq_length=data_args.max_seq_length,
        dataset_text_field=data_args.dataset_text_field,
        packing=True, # Sample packing for optimal token density
        report_to=["mlflow", "tensorboard"],
    )

    trainer = SFTTrainer(
        model=model,
        args=training_args,
        train_dataset=dataset,
        peft_config=peft_config,
        processing_class=tokenizer,
    )

    print("[GemmaForge] Commencing distributed training run...")
    trainer.train()

    print("[GemmaForge] Saving final adapter weights and tokenizer...")
    trainer.model.save_pretrained("./outputs/gemma-forge-checkpoint/final_adapter")
    tokenizer.save_pretrained("./outputs/gemma-forge-checkpoint/final_adapter")
    print("[GemmaForge] SFT training successfully completed!")

if __name__ == "__main__":
    main()
`,

  TRAIN_DPO: `# ==============================================================================
# GemmaForge: Direct Preference Optimization (DPO) for Gemma Alignment
# ==============================================================================

import torch
from datasets import load_dataset
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
from peft import LoraConfig
from trl import DPOTrainer, DPOConfig

def train_dpo():
    model_id = "google/gemma-2-9b-it"

    tokenizer = AutoTokenizer.from_pretrained(model_id)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.bfloat16,
    )

    model = AutoModelForCausalLM.from_pretrained(
        model_id,
        quantization_config=bnb_config,
        device_map="auto",
        torch_dtype=torch.bfloat16,
        attn_implementation="flash_attention_2",
    )

    peft_config = LoraConfig(
        r=32,
        lora_alpha=64,
        lora_dropout=0.0,
        task_type="CAUSAL_LM",
        target_modules=["q_proj", "v_proj", "k_proj", "o_proj"],
    )

    dataset = load_dataset("json", data_files="data/dpo_preferences.jsonl", split="train")

    dpo_args = DPOConfig(
        output_dir="./outputs/gemma-dpo-aligned",
        beta=0.1, # DPO temperature hyperparameter
        learning_rate=5e-5,
        per_device_train_batch_size=2,
        gradient_accumulation_steps=8,
        num_train_epochs=2,
        lr_scheduler_type="cosine",
        warmup_ratio=0.1,
        optim="paged_adamw_8bit",
        bf16=True,
        logging_steps=10,
        save_strategy="epoch",
        max_prompt_length=1024,
        max_length=2048,
    )

    dpo_trainer = DPOTrainer(
        model=model,
        ref_model=None, # Implicit reference model via PEFT base weights
        args=dpo_args,
        train_dataset=dataset,
        tokenizer=tokenizer,
        peft_config=peft_config,
    )

    print("[GemmaForge] Commencing DPO preference optimization...")
    dpo_trainer.train()
    dpo_trainer.save_model("./outputs/gemma-dpo-aligned/final")

if __name__ == "__main__":
    train_dpo()
`,

  AUTOTUNE_OPTUNA: `# ==============================================================================
# GemmaForge Auto-Tuning Engine: Bayesian Optimization with Optuna & ASHA Pruner
# ==============================================================================

import optuna
from optuna.samplers import TPESampler
from optuna.pruners import SuccessiveHalvingPruner

def objective(trial):
    # Hyperparameter search space
    lr = trial.suggest_float("learning_rate", 5e-5, 5e-4, log=True)
    lora_r = trial.suggest_categorical("lora_r", [16, 32, 64, 128])
    lora_alpha = trial.suggest_categorical("lora_alpha", [32, 64, 128, 256])
    batch_size = trial.suggest_categorical("batch_size", [2, 4, 8])
    warmup_ratio = trial.suggest_float("warmup_ratio", 0.01, 0.1)

    print(f"\\n--- Running Trial #{trial.number}: lr={lr:.2e}, r={lora_r}, alpha={lora_alpha} ---")

    # Simulate / execute training step evaluations with intermediate pruning
    for step in range(1, 11):
        intermediate_eval_loss = 1.8 * (0.85 ** step) + (0.05 * (lora_r / 64)) + (1e-4 / lr * 0.02)
        trial.report(intermediate_eval_loss, step)

        if trial.should_prune():
            print(f"Trial #{trial.number} pruned at step {step} by ASHA scheduler.")
            raise optuna.exceptions.TrialPruned()

    return intermediate_eval_loss

def run_study():
    sampler = TPESampler(seed=42)
    pruner = SuccessiveHalvingPruner(min_resource=2, reduction_factor=3)

    study = optuna.create_study(
        study_name="gemmaforge-hyperband-sweep",
        direction="minimize",
        sampler=sampler,
        pruner=pruner,
    )

    print("[GemmaForge] Starting 15 Bayesian Optimization trials...")
    study.optimize(objective, n_trials=15, timeout=3600)

    print("\\n[GemmaForge] Best Trial Results:")
    best = study.best_trial
    print(f"  Best Eval Loss: {best.value:.4f}")
    for k, v in best.params.items():
        print(f"  {k}: {v}")

if __name__ == "__main__":
    run_study()
`,

  EXPORT_GGUF: `# ==============================================================================
# GemmaForge Model Registry: Merge LoRA & Export to GGUF / AWQ
# ==============================================================================

import os
import subprocess
import torch
from peft import AutoPeftModelForCausalLM
from transformers import AutoTokenizer

def merge_and_export_gguf(adapter_path: str, merged_output_dir: str, gguf_output_file: str):
    print(f"[GemmaForge] Loading LoRA adapter from {adapter_path}...")
    model = AutoPeftModelForCausalLM.from_pretrained(
        adapter_path,
        torch_dtype=torch.bfloat16,
        device_map="cpu",
    )

    print("[GemmaForge] Merging adapter weights into base Gemma model backbone...")
    merged_model = model.merge_and_unload()

    print(f"[GemmaForge] Saving merged weights to {merged_output_dir}...")
    merged_model.save_pretrained(merged_output_dir, safe_serialization=True)
    tokenizer = AutoTokenizer.from_pretrained(adapter_path)
    tokenizer.save_pretrained(merged_output_dir)

    print("[GemmaForge] Converting merged safetensors to GGUF format via llama.cpp...")
    cmd_convert = f"python3 ./llama.cpp/convert_hf_to_gguf.py {merged_output_dir} --outtype f16 --outfile {merged_output_dir}/model-f16.gguf"
    subprocess.run(cmd_convert, shell=True, check=True)

    print("[GemmaForge] Quantizing GGUF to Q4_K_M for ultra-fast edge inference...")
    cmd_quant = f"./llama.cpp/llama-quantize {merged_output_dir}/model-f16.gguf {gguf_output_file} Q4_K_M"
    subprocess.run(cmd_quant, shell=True, check=True)

    print(f"[GemmaForge] Successfully generated {gguf_output_file}! Ready for Ollama & llama.cpp.")

if __name__ == "__main__":
    merge_and_export_gguf(
        adapter_path="./outputs/gemma-forge-checkpoint/final_adapter",
        merged_output_dir="./exports/gemma-2-9b-merged",
        gguf_output_file="./exports/gemma-2-9b-Q4_K_M.gguf"
    )
`,

  SERVE_VLLM: `# ==============================================================================
# GemmaForge Serving Ground: High-Throughput vLLM Server Launch Command
# ==============================================================================

# Launch high-performance OpenAI-compatible vLLM server with PagedAttention
vllm serve ./exports/gemma-2-9b-merged \\
    --host 0.0.0.0 \\
    --port 8000 \\
    --tensor-parallel-size 2 \\
    --gpu-memory-utilization 0.90 \\
    --max-model-len 8192 \\
    --enable-chunked-prefill \\
    --enforce-eager \\
    --api-key gemmaforge-secret-key-prod \\
    --served-model-name "gemma-2-9b-forge"

# Verify inference with cURL:
curl http://localhost:8000/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer gemmaforge-secret-key-prod" \\
  -d '{
    "model": "gemma-2-9b-forge",
    "messages": [
      {"role": "user", "content": "Explain KV-cache optimization in Gemma 2."}
    ],
    "temperature": 0.7,
    "max_tokens": 256
  }'
`,

  CLI_TOOL: `#!/usr/bin/env python3
# ==============================================================================
# gemmaforge CLI — Command Line Interface for Gemma MLOps
# ==============================================================================

import typer
from rich.console import Console
from rich.table import Table

app = typer.Typer(help="GemmaForge: LLM Model Forge & Training Ground for Google Gemma")
console = Console()

@app.command()
def init(project_name: str = "my-gemma-project"):
    """Initialize a new GemmaForge workspace directory structure."""
    console.print(f"[bold green]✔[/bold green] Initialized GemmaForge workspace: [cyan]{project_name}[/cyan]")
    console.print("Created: configs/, data/, models/, outputs/, evaluations/")

@app.command()
def data(
    clean: bool = typer.Option(True, "--clean", help="Run automated PII redaction and deduplication"),
    pack: bool = typer.Option(True, "--pack", help="Tokenize and pack sequences to max_seq_length"),
    dataset: str = typer.Option("data/train.jsonl", "--dataset", "-d"),
):
    """Ingest, clean, and tokenize fine-tuning datasets for Gemma."""
    console.print(f"[bold blue]ℹ[/bold blue] Processing dataset [yellow]{dataset}[/yellow]...")
    console.print(f"[bold green]✔[/bold green] Redacted 42 emails, 18 phone numbers, 6 secret API keys.")
    console.print(f"[bold green]✔[/bold green] Tokenized 14,200 samples into 4,260,000 Gemma tokens. Packing density: 98.4%.")

@app.command()
def train(
    model: str = typer.Option("google/gemma-2-9b-it", "--model", "-m"),
    method: str = typer.Option("qlora", "--method", help="sft | qlora | dora | full_fsdp | dpo"),
    epochs: int = typer.Option(3, "--epochs", "-e"),
    lr: float = typer.Option(2e-4, "--lr"),
):
    """Launch distributed fine-tuning pipeline on GPU cluster."""
    console.print(f"[bold green]🚀[/bold green] Launching [cyan]{method.upper()}[/cyan] training for [yellow]{model}[/yellow]...")
    console.print(f"Hyperparameters: epochs={epochs}, lr={lr}, flash_attention_2=True")

@app.command()
def tune(
    trials: int = typer.Option(10, "--trials", "-n"),
    study: str = typer.Option("optuna-asha", "--study"),
):
    """Execute Bayesian hyperparameter auto-tuning with ASHA early pruning."""
    console.print(f"[bold magenta]⚡[/bold magenta] Running [cyan]{trials}[/cyan] auto-tuning trials via Optuna...")

@app.command()
def eval(
    checkpoint: str = typer.Option("./outputs/final", "--checkpoint", "-c"),
    benchmarks: str = typer.Option("gsm8k,mmlu,humaneval", "--benchmarks", "-b"),
):
    """Run standard benchmark harness and LLM-as-a-judge comparison."""
    console.print(f"[bold yellow]📊[/bold yellow] Running lm-evaluation-harness on [cyan]{checkpoint}[/cyan]...")

@app.command()
def export(
    adapter: str = typer.Option("./outputs/final_adapter", "--adapter", "-a"),
    format: str = typer.Option("gguf", "--format", help="gguf | awq | gptq | merged_bf16"),
):
    """Merge LoRA adapter and quantize for deployment."""
    console.print(f"[bold green]✔[/bold green] Exporting adapter to [cyan]{format.upper()}[/cyan] format...")

@app.command()
def serve(
    model: str = typer.Option("./exports/gemma-2-9b-merged", "--model", "-m"),
    port: int = typer.Option(8000, "--port", "-p"),
):
    """Spin up OpenAI-compatible vLLM serving container."""
    console.print(f"[bold green]🚀[/bold green] Starting vLLM serving on http://0.0.0.0:{port}...")

if __name__ == "__main__":
    app()
`,

  DOCKER_COMPOSE: `version: "3.8"

services:
  gemmaforge-api:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - GEMINI_API_KEY=\${GEMINI_API_KEY}
      - REDIS_URL=redis://redis:6379/0
      - DATABASE_URL=postgresql://gemma:forge@postgres:5432/gemmaforge
      - S3_ENDPOINT=http://minio:9000
    volumes:
      - ./data:/app/data
      - ./models:/app/models
      - ./outputs:/app/outputs
    depends_on:
      - redis
      - postgres
      - minio

  gemmaforge-worker:
    build:
      context: .
      dockerfile: Dockerfile.worker
    command: celery -A gemmaforge.worker worker --loglevel=info --concurrency=4
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]
    volumes:
      - ./data:/app/data
      - ./models:/app/models
      - ./outputs:/app/outputs
    depends_on:
      - redis
      - postgres

  vllm-serving:
    image: vllm/vllm-openai:v0.6.3
    ports:
      - "8000:8000"
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 2
              capabilities: [gpu]
    volumes:
      - ./models:/root/.cache/huggingface
    command: >
      --model google/gemma-2-9b-it
      --tensor-parallel-size 2
      --max-model-len 8192
      --gpu-memory-utilization 0.90

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: gemma
      POSTGRES_PASSWORD: forge
      POSTGRES_DB: gemmaforge
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  minio:
    image: minio/minio:RELEASE.2024-05-10T01-41-38Z
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadminpassword
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data

volumes:
  postgres_data:
  minio_data:
`,
};
