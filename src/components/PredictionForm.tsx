import React, { useState } from 'react';
import { User, TrendingUp, AlertTriangle, CheckCircle, Target } from 'lucide-react';
import { StudentData, PredictionResult } from '../types';
import { predictPerformance } from '../utils/mlModel';
import { buildLocalSingleStudentInsight } from '../utils/localAssistant';
import InsightsPanel from './InsightsPanel';

interface PredictionFormProps {
  onPrediction: (result: PredictionResult) => void;
}

const PredictionForm: React.FC<PredictionFormProps> = ({ onPrediction }) => {
  const [studentData, setStudentData] = useState<StudentData>({
    name: '',
    attendanceRate: 85,
    assignments: [8, 8.5, 9], // Default 3 assignments out of 10
    assignmentAverage: 0, // Will be calculated
    termAssessment1: 16,
    termAssessment2: 17,
    labMarks: 24,
    labTotal: 30,
    teacherRemark: 8,
    remarkCaption: '',
    previousSGPA: 8.0,
  });

  const [numAssignments, setNumAssignments] = useState(3);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);

  const handleInputChange = (field: keyof StudentData, value: string | number) => {
    setStudentData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAssignmentChange = (index: number, value: number) => {
    setStudentData(prev => {
      const newAssignments = [...prev.assignments];
      newAssignments[index] = value;
      return {
        ...prev,
        assignments: newAssignments,
      };
    });
  };

  const handleNumAssignmentsChange = (num: number) => {
    setNumAssignments(num);
    setStudentData(prev => {
      const newAssignments = [...prev.assignments];
      // Adjust array length
      if (num > newAssignments.length) {
        // Add default values for new assignments
        while (newAssignments.length < num) {
          newAssignments.push(8);
        }
      } else {
        // Trim array
        newAssignments.splice(num);
      }
      return {
        ...prev,
        assignments: newAssignments,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const prediction = predictPerformance(studentData);
    setResult(prediction);
    onPrediction(prediction);
    setIsSubmitting(false);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'high': return <AlertTriangle className="w-5 h-5" />;
      case 'medium': return <TrendingUp className="w-5 h-5" />;
      case 'low': return <CheckCircle className="w-5 h-5" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="glass-card rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
              <User className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">Performance Prediction</h1>
              <p className="text-blue-200 text-lg">AI-powered academic performance analysis</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <div className="space-y-6">
          <div className="glass-card rounded-3xl p-8">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">Student Details</h3>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-white mb-3">
                    Student Name
                  </label>
                  <input
                    type="text"
                    required
                    value={studentData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="input-modern w-full"
                    placeholder="Enter student name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-3">
                    Attendance Rate (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={studentData.attendanceRate}
                    onChange={(e) => handleInputChange('attendanceRate', parseFloat(e.target.value))}
                    className="input-modern w-full"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-white mb-3">
                      Term Assessment 1 (out of 20)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={studentData.termAssessment1}
                      onChange={(e) => handleInputChange('termAssessment1', parseFloat(e.target.value))}
                      className="input-modern w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white mb-3">
                      Term Assessment 2 (out of 20)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={studentData.termAssessment2}
                      onChange={(e) => handleInputChange('termAssessment2', parseFloat(e.target.value))}
                      className="input-modern w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-white mb-3">
                      Lab Marks Obtained
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={studentData.labTotal}
                      value={studentData.labMarks}
                      onChange={(e) => handleInputChange('labMarks', parseFloat(e.target.value))}
                      className="input-modern w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white mb-3">
                      Lab Total Marks
                    </label>
                    <select
                      value={studentData.labTotal}
                      onChange={(e) => handleInputChange('labTotal', parseInt(e.target.value))}
                      className="input-modern w-full"
                    >
                      <option value={20}>Out of 20</option>
                      <option value={30}>Out of 30</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-white mb-3">
                      Teacher Remark (out of 10)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={studentData.teacherRemark}
                        onChange={(e) => handleInputChange('teacherRemark', parseFloat(e.target.value))}
                        className="input-modern w-full pr-12"
                      />
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">/10</div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white mb-3">
                      Remark Caption (Optional)
                    </label>
                    <input
                      type="text"
                      value={studentData.remarkCaption || ''}
                      onChange={(e) => {
                        setStudentData(prev => ({
                          ...prev,
                          remarkCaption: e.target.value
                        }));
                      }}
                      className="input-modern w-full"
                      placeholder="e.g., Excellent work"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-3">
                    Previous Semester SGPA (Optional, out of 10)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      value={studentData.previousSGPA || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        setStudentData(prev => ({
                          ...prev,
                          previousSGPA: value ? parseFloat(value) : undefined
                        }));
                      }}
                      className="input-modern w-full pr-12"
                      placeholder="e.g., 8.5"
                    />
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">/10</div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-3">
                    Number of Assignments
                  </label>
                  <select
                    value={numAssignments}
                    onChange={(e) => handleNumAssignmentsChange(parseInt(e.target.value))}
                    className="input-modern w-full"
                  >
                    <option value={3}>3 Assignments</option>
                    <option value={4}>4 Assignments</option>
                    <option value={5}>5 Assignments</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-3">
                    Assignment Marks (Each out of 10)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Array.from({ length: numAssignments }, (_, index) => (
                      <div key={index}>
                        <label className="block text-xs font-medium text-blue-200 mb-2">
                          Assignment {index + 1}
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          step="0.5"
                          value={studentData.assignments[index] || 0}
                          onChange={(e) => handleAssignmentChange(index, parseFloat(e.target.value) || 0)}
                          className="input-modern w-full"
                          placeholder="0"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !studentData.name}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center space-x-3">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Analyzing Performance...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <TrendingUp className="w-5 h-5" />
                      <span>Predict Performance</span>
                    </div>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-6">
          {result ? (
            <>
              <div className="glass-card rounded-3xl p-8 floating-card">
                <div className="flex items-center space-x-3 mb-8">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      Results for {result.student.name}
                    </h3>
                    <p className="text-blue-200">AI-powered performance analysis</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="stat-card">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-gray-800 mb-1">
                      {result.predictedCGPA.toFixed(2)}
                    </div>
                    <div className="text-gray-600 font-medium">Predicted CGPA</div>
                    <div className="text-sm text-gray-500">Out of 10.0</div>
                  </div>
                  
                  <div className="stat-card">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                        <Target className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-gray-800 mb-1">
                      {result.predictedFinalExam.toFixed(0)}%
                    </div>
                    <div className="text-gray-600 font-medium">Final Exam Score</div>
                    <div className="text-sm text-gray-500">Expected performance</div>
                  </div>
                </div>

                <div className={`glass-card rounded-2xl p-6 ${getRiskColor(result.riskLevel)} border-2`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        {getRiskIcon(result.riskLevel)}
                      </div>
                      <div>
                        <div className="text-xl font-bold capitalize">{result.riskLevel} Risk Level</div>
                        <div className="text-sm opacity-80">Academic performance assessment</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{(result.confidence * 100).toFixed(0)}%</div>
                      <div className="text-sm opacity-80">AI Confidence</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-3xl p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-white">AI Recommendations</h4>
                </div>
                <div className="space-y-4">
                  {result.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start space-x-4 p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-white font-medium">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>

              <InsightsPanel
                title="Structured insights"
                subtitle="Generated on your device from this prediction — use Ask for interactive doubts."
                body={buildLocalSingleStudentInsight(result)}
                theme="dark"
              />
            </>
          ) : (
            <div className="glass-card rounded-3xl p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Ready for Analysis</h3>
              <p className="text-blue-200 text-lg max-w-md mx-auto">
                Fill in the student details and click "Predict Performance" to get AI-powered insights and recommendations.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PredictionForm;