import React, { useState } from 'react';
import { User, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { StudentData, PredictionResult } from '../types';
import { predictPerformance } from '../utils/mlModel';

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
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200">
        <div className="border-b border-gray-200 px-8 py-6">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Student Performance Prediction</h2>
              <p className="text-gray-600 text-sm">Enter student data for AI-powered CGPA prediction</p>
            </div>
          </div>
        </div>

        <div className="p-8">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Form */}
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Student Information</h3>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Student Name
                      </label>
                      <input
                        type="text"
                        required
                        value={studentData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                        placeholder="Enter student name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Attendance Rate (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={studentData.attendanceRate}
                        onChange={(e) => handleInputChange('attendanceRate', parseFloat(e.target.value))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Term Assessment 1 (out of 20)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="20"
                          value={studentData.termAssessment1}
                          onChange={(e) => handleInputChange('termAssessment1', parseFloat(e.target.value))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Term Assessment 2 (out of 20)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="20"
                          value={studentData.termAssessment2}
                          onChange={(e) => handleInputChange('termAssessment2', parseFloat(e.target.value))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Lab Marks Obtained
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={studentData.labTotal}
                          value={studentData.labMarks}
                          onChange={(e) => handleInputChange('labMarks', parseFloat(e.target.value))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Lab Total Marks
                        </label>
                        <select
                          value={studentData.labTotal}
                          onChange={(e) => handleInputChange('labTotal', parseInt(e.target.value))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                        >
                          <option value={20}>Out of 20</option>
                          <option value={30}>Out of 30</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-3">
                          Teacher Remark (out of 10)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max="10"
                            value={studentData.teacherRemark}
                            onChange={(e) => handleInputChange('teacherRemark', parseFloat(e.target.value))}
                            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white/80"
                          />
                          <div className="absolute right-3 top-3 text-slate-400 text-sm">/10</div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-3">
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
                          className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white/80"
                          placeholder="e.g., Excellent work"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-3">
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
                          className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white/80"
                          placeholder="e.g., 8.5"
                        />
                        <div className="absolute right-3 top-3 text-slate-400 text-sm">/10</div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Number of Assignments
                      </label>
                      <select
                        value={numAssignments}
                        onChange={(e) => handleNumAssignmentsChange(parseInt(e.target.value))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      >
                        <option value={3}>3 Assignments</option>
                        <option value={4}>4 Assignments</option>
                        <option value={5}>5 Assignments</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Assignment Marks (Each out of 10)
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {Array.from({ length: numAssignments }, (_, index) => (
                          <div key={index}>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Assignment {index + 1}
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="10"
                              step="0.5"
                              value={studentData.assignments[index] || 0}
                              onChange={(e) => handleAssignmentChange(index, parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                              placeholder="0"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || !studentData.name}
                      className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Analyzing...</span>
                        </div>
                      ) : (
                        'Predict Performance'
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
                  <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">
                      Prediction Results for {result.student.name}
                    </h3>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="text-2xl font-bold text-blue-700">
                          {result.predictedCGPA.toFixed(2)}
                        </div>
                        <div className="text-sm font-medium text-blue-600">Predicted CGPA</div>
                        <div className="text-xs text-blue-500">Out of 10.0</div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <div className="text-2xl font-bold text-green-700">
                          {result.predictedFinalExam.toFixed(0)}%
                        </div>
                        <div className="text-sm font-medium text-green-600">Final Exam Score</div>
                        <div className="text-xs text-green-500">Predicted performance</div>
                      </div>
                    </div>

                    <div className={`flex items-center justify-between p-4 rounded-lg border ${getRiskColor(result.riskLevel)}`}>
                      <div className="flex items-center space-x-3">
                        {getRiskIcon(result.riskLevel)}
                        <div>
                          <div className="font-semibold capitalize">{result.riskLevel} Risk Level</div>
                          <div className="text-sm opacity-80">Academic performance risk</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{(result.confidence * 100).toFixed(0)}%</div>
                        <div className="text-xs opacity-80">Confidence</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
                    <h4 className="font-semibold text-gray-900 mb-4">AI Recommendations</h4>
                    <div className="space-y-3">
                      {result.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-gray-50 rounded-lg p-8 text-center border border-gray-200">
                  <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready for Prediction</h3>
                  <p className="text-gray-600">
                    Enter student information and click "Predict Performance" to see AI-powered predictions and recommendations.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictionForm;