import React, { useEffect, useMemo, useState } from 'react';
import { User, TrendingUp, AlertTriangle, CheckCircle, Target } from 'lucide-react';
import { StudentData, PredictionResult } from '../types';
import type { StudentRecord } from '../types/portal';
import { predictPerformance } from '../utils/mlModel';
import { apiMlPredict } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useEduPortal } from '../context/EduPortalContext';
import { buildLocalSingleStudentInsight } from '../utils/localAssistant';
import InsightsPanel from './InsightsPanel';

const EMPTY_ROSTER_PREVIEW: StudentData = {
  name: '',
  attendanceRate: 0,
  assignments: [0, 0, 0, 0, 0],
  assignmentAverage: 0,
  termAssessment1: 0,
  termAssessment2: 0,
  labMarks: 0,
  labTotal: 30,
  teacherRemark: 0,
  remarkCaption: '',
  previousSGPA: undefined,
};

function rosterRowToFormState(record: StudentRecord): { student: StudentData; numAssignments: number } {
  const d = record.data;
  const basis = [...(d.assignments?.length ? d.assignments : [8, 8, 8])];
  while (basis.length < 5) basis.push(8);
  const numAssignments = Math.min(5, Math.max(3, d.assignments?.length || 3));
  const slice = basis.slice(0, numAssignments);
  const sum = slice.reduce((s, x) => s + x, 0);
  const assignmentAverage = slice.length ? (sum / (slice.length * 10)) * 100 : d.assignmentAverage;
  return {
    student: {
      ...d,
      id: record.id,
      assignments: basis,
      assignmentAverage,
    },
    numAssignments,
  };
}

interface PredictionFormProps {
  onPrediction: (result: PredictionResult) => void;
}

const PredictionForm: React.FC<PredictionFormProps> = ({ onPrediction }) => {
  const { token, offlineDemo, authReady } = useAuth();
  const { records, portalBackendActive, reloadFromBackend } = useEduPortal();
  const rosterMode = portalBackendActive && records.length > 0;
  const fieldsLocked = rosterMode;

  const rollOptions = useMemo(() => {
    const seen = new Set<string>();
    const rolls: string[] = [];
    for (const r of records) {
      const roll = (r.rollNumber ?? '').trim();
      if (!roll) continue;
      const key = roll.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      rolls.push(roll);
    }
    rolls.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
    return rolls;
  }, [records]);

  const [selectedRoll, setSelectedRoll] = useState('');

  const [studentData, setStudentData] = useState<StudentData>({
    name: '',
    attendanceRate: 85,
    assignments: [8, 8.5, 9],
    assignmentAverage: 0,
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

  useEffect(() => {
    if (!rosterMode) {
      setSelectedRoll('');
    }
  }, [rosterMode]);

  useEffect(() => {
    if (!rosterMode) return;
    if (!selectedRoll) {
      setStudentData(EMPTY_ROSTER_PREVIEW);
      setNumAssignments(3);
      setResult(null);
      return;
    }
    const normalized = selectedRoll.trim().toLowerCase();
    const rec = records.find(r => (r.rollNumber ?? '').trim().toLowerCase() === normalized);
    if (!rec) {
      setStudentData(EMPTY_ROSTER_PREVIEW);
      setNumAssignments(3);
      setResult(null);
      return;
    }
    const mapped = rosterRowToFormState(rec);
    setStudentData(mapped.student);
    setNumAssignments(mapped.numAssignments);
    setResult(null);
  }, [rosterMode, records, selectedRoll]);

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

    try {
      await new Promise(resolve => setTimeout(resolve, 400));
      const useBackend = !!(token && authReady && !offlineDemo);
      let prediction: PredictionResult;
        try {
          if (useBackend && token) {
            prediction = await apiMlPredict(token, studentData);
          } else {
            prediction = predictPerformance(studentData);
          }
        } catch {
          prediction = predictPerformance(studentData);
        }
      setResult(prediction);
      onPrediction(prediction);
    } finally {
      setIsSubmitting(false);
    }
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

  const canPredict =
    rosterMode ? !!selectedRoll && !!studentData.name?.trim() : !!studentData.name?.trim();

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
            {rosterMode && (
              <div className="mb-6 space-y-3 rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                <label className="block text-sm font-semibold text-white">Roll number</label>
                <p className="text-xs text-blue-100/90 leading-relaxed">
                  Choose a roll number to load that student&apos;s saved metrics from the database. Fields are
                  read-only here; update records in the roster editor if something changed.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <select
                    value={selectedRoll}
                    onChange={e => setSelectedRoll(e.target.value)}
                    className="input-modern w-full sm:flex-1"
                  >
                    <option value="">— Select roll number —</option>
                    {rollOptions.map(roll => (
                      <option key={roll} value={roll}>
                        {roll}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => void reloadFromBackend()}
                    className="rounded-xl border border-white/20 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10"
                  >
                    Refresh roster
                  </button>
                </div>
              </div>
            )}
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
                    disabled={fieldsLocked}
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
                    disabled={fieldsLocked}
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
                      disabled={fieldsLocked}
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
                      disabled={fieldsLocked}
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
                      disabled={fieldsLocked}
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
                      disabled={fieldsLocked}
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
                        disabled={fieldsLocked}
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
                      disabled={fieldsLocked}
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
                      disabled={fieldsLocked}
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
                    disabled={fieldsLocked}
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
                          disabled={fieldsLocked}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !canPredict}
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
                {rosterMode
                  ? 'Select a roll number to load saved student metrics (read-only), then run Predict Performance.'
                  : 'Fill in the student details and click Predict Performance to get AI-powered insights and recommendations.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PredictionForm;