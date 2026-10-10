export type NavigationTab =
  | 'hub'
  | 'data'
  | 'training'
  | 'autotune'
  | 'evaluation'
  | 'registry'
  | 'serving'
  | 'playground'
  | 'architecture';

export interface GemmaModelInfo {
  id: string;
  name: string;
  family: 'Gemma 1' | 'Gemma 2' | 'Gemma 3';
  parameters: string;
  paramCountNum: number; // in billions
  contextWindow: number;
  slidingWindow?: number;
  vocabSize: number;
  hiddenDim: number;
  numHeads: number;
  numKvHeads: number;
  isGated: boolean;
  licenseAccepted: boolean;
  cachedLocally: boolean;
  diskSizeGB: number;
  recommendedMinVramGB: {
    bf16: number;
    int8: number;
    qlora_4bit: number;
  };
  supportedTasks: string[];
  description: string;
  hfRepoId: string;
}

export interface DatasetItem {
  id: string;
  name: string;
  format: 'JSONL' | 'CSV' | 'Parquet' | 'Hugging Face' | 'Synthetic';
  taskType: 'SFT (Instruction)' | 'DPO (Preference)' | 'Pre-training' | 'Distillation';
  samplesCount: number;
  tokenCount: number;
  sizeMB: number;
  createdAt: string;
  piiCleaned: boolean;
  packed: boolean;
  status: 'Ready' | 'Processing' | 'Tokenizing';
  description: string;
  previewSamples: Array<{
    id: string;
    instruction?: string;
    input?: string;
    output?: string;
    prompt?: string;
    chosen?: string;
    rejected?: string;
    tokens?: number;
  }>;
}

export interface TrainingRun {
  id: string;
  name: string;
  modelId: string;
  modelName: string;
  datasetId: string;
  datasetName: string;
  method: 'QLoRA' | 'LoRA' | 'DoRA' | 'Full Fine-Tuning (FSDP)' | 'DPO' | 'ORPO' | 'PPO' | 'Distillation';
  status: 'running' | 'completed' | 'failed' | 'queued';
  currentEpoch: number;
  totalEpochs: number;
  currentStep: number;
  totalSteps: number;
  trainLoss: number;
  evalLoss: number;
  learningRate: number;
  throughputTokensPerSec: number;
  gpuMemoryUsagePercent: number;
  durationMinutes: number;
  hardware: string;
  createdAt: string;
  lossHistory: Array<{ step: number; trainLoss: number; evalLoss: number; lr: number; gradNorm: number }>;
  hyperparameters: {
    learningRate: number;
    batchSize: number;
    gradientAccumulation: number;
    loraRank: number;
    loraAlpha: number;
    loraDropout: number;
    optimizer: string;
    scheduler: string;
    warmupRatio: number;
    weightDecay: number;
    precision: string;
    flashAttention2: boolean;
    gradientCheckpointing: boolean;
  };
  logs: string[];
}

export interface AutoTuneTrial {
  trialId: string;
  runNumber: number;
  status: 'Completed' | 'Pruned (ASHA)' | 'Running' | 'Pending';
  learningRate: number;
  loraRank: number;
  loraAlpha: number;
  batchSize: number;
  evalLoss: number;
  mmluScore: number;
  peakVramGB: number;
  throughput: number;
  durationMin: number;
  isParetoOptimal?: boolean;
}

export interface BenchmarkScore {
  name: string;
  category: 'Reasoning' | 'Knowledge' | 'Coding' | 'Instruction' | 'Truthfulness';
  baseScore: number;
  tunedScore: number;
  metric: string;
  description: string;
}

export interface ModelCheckpoint {
  id: string;
  name: string;
  baseModel: string;
  runId: string;
  adapterFormat: 'LoRA Adapter' | 'Merged BF16' | 'GGUF Q4_K_M' | 'GGUF Q8_0' | 'AWQ 4-bit' | 'GPTQ 4-bit';
  fileSizeGB: number;
  evalMmlu: number;
  gsm8k: number;
  createdAt: string;
  hfExported: boolean;
  hfRepoUrl?: string;
  merged: boolean;
  quantizedVariants: string[];
}

export interface ServingDeployment {
  id: string;
  name: string;
  modelId: string;
  modelName: string;
  engine: 'vLLM' | 'TGI' | 'Ollama' | 'llama.cpp';
  endpointUrl: string;
  status: 'Healthy' | 'Deploying' | 'Stopped' | 'Degraded';
  replicas: number;
  gpuCount: number;
  gpuType: string;
  p50LatencyMs: number;
  p99LatencyMs: number;
  activeRequests: number;
  tokensPerSecond: number;
  kvCacheUsagePercent: number;
  startedAt: string;
}

export interface SystemClusterStatus {
  nodes: number;
  gpuType: string;
  totalGpus: number;
  activeGpus: number;
  allocatedVramGB: number;
  totalVramGB: number;
  clusterHealth: string;
}
