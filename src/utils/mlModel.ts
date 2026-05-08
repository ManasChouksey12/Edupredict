import type { PredictionResult, StudentData } from '../types';
export { predictPerformance, studentFeaturesForMl } from '@shared/predictPerformance';
export type { StudentData, PredictionResult };

// Model performance metrics (simulated — replace with empirical validation once you ship real grades)
export const getModelMetrics = () => ({
  r2Score: 0.923,
  mae: 0.187,
  mse: 0.045,
  accuracy: 0.952,
});
