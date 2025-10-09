import React, { useState } from 'react';
import Header from './components/Header';
import Navigation from './components/Navigation';
import PredictionForm from './components/PredictionForm';
import Dashboard from './components/Dashboard';
import BatchProcessor from './components/BatchProcessor';
import Analytics from './components/Analytics';
import { PredictionResult } from './types';

function App() {
  const [activeTab, setActiveTab] = useState('prediction');
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);

  const handleNewPrediction = (prediction: PredictionResult) => {
    setPredictions(prev => [prediction, ...prev].slice(0, 100)); // Keep last 100 predictions
  };

  const handleBatchPredictions = (newPredictions: PredictionResult[]) => {
    setPredictions(prev => [...newPredictions, ...prev].slice(0, 100));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'prediction' && (
            <PredictionForm onPrediction={handleNewPrediction} />
          )}
          
          {activeTab === 'dashboard' && (
            <Dashboard predictions={predictions} />
          )}
          
          {activeTab === 'batch' && (
            <BatchProcessor onBatchPredictions={handleBatchPredictions} />
          )}
          
          {activeTab === 'analytics' && (
            <Analytics predictions={predictions} />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;