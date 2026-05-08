export type { StudentData, PredictionResult } from '@shared/types';

export interface ModelMetrics {
  r2Score: number;
  mae: number;
  mse: number;
  accuracy: number;
}
