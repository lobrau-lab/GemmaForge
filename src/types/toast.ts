export type AlertSeverity = 'critical' | 'warning' | 'info' | 'success';

export interface ToastAlert {
  id: string;
  type: 'vram_exceeded' | 'throughput_drop' | 'oom_warning' | 'info' | 'success';
  severity: AlertSeverity;
  title: string;
  message: string;
  runId?: string;
  runName?: string;
  metricValue?: string;
  baselineThreshold?: string;
  timestamp: string;
  actionLabel?: string;
  actionType?: 'enable_gradient_checkpointing' | 'reduce_batch_size' | 'view_run';
  dismissible?: boolean;
  autoDismissMs?: number;
}

export interface AlertThresholdSettings {
  vramWarningPercent: number; // e.g. 85%
  vramCriticalPercent: number; // e.g. 92%
  throughputBaselineTokPerSec: number; // e.g. 1000 tok/s
  autoNotifyEnabled: boolean;
  audioAlertsEnabled: boolean;
}
