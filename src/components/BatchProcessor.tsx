import React, { useState, useRef } from 'react';
import { Upload, Download, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { StudentData, PredictionResult } from '../types';
import { predictPerformance } from '../utils/mlModel';


interface BatchProcessorProps {
  onBatchPredictions: (predictions: PredictionResult[]) => void;
}

const BatchProcessor: React.FC<BatchProcessorProps> = ({ onBatchPredictions }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<PredictionResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
const sampleData = [ 
    'name,attendanceRate,assignment1,assignment2,assignment3,assignment4,assignment5,termAssessment1,termAssessment2,labMarks,labTotal,teacherRemark,remarkCaption,previousSGPA', 
    'Manas Chouksey,95,10,9.5,10,9.5,9,20,19,29,30,10,Exceptional student,9.1', 
    'Adarsh Bagul,92,9.5,9,9.5,10,8.5,19,20,28,30,10,Outstanding performance,8.8', 
    'Aditya Desai,90,9,9.5,9.5,9,9,18,19,27,30,9,Very good work,8.4', 
    'Kunal Dahiphale,88,8.5,9,9,9.5,9.5,17,18,26,30,8,Good progress,7.9', 
    'Priya Sharma,87,8.5,9,8.5,9,8.5,17,18,25,30,8,Good performance,8.0',
    'Rahul Patel,85,9,8.5,9.5,9,,18,19,25,30,9,Excellent work,8.2',
    'Ananya Iyer,68,5.5,6,5.5,6,5,10,11,12,20,4,Serious improvement needed,5.2',
    'Arjun Reddy,55,4.5,5,4,5.5,4.5,8,9,10,20,3,Critical attention required,4.5',
    'Sneha Gupta,42,3,3.5,4,3.5,,5,6,6,20,2,Immediate intervention needed,3.2',
    'Vikram Singh,35,2.5,3,2,3.5,2,4,5,5,20,1,Urgent academic support required,2.8'
  ].join('\n');

  const downloadSampleCSV = () => {
    const blob = new Blob([sampleData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_students.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const parseCSV = (csvText: string): StudentData[] => {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());

    return lines.slice(1).map((line, index) => {
      const values = line.split(',').map(v => v.trim());
      const student: Partial<StudentData> & { assignments: number[]; assignmentAverage: number } = {
        assignments: [],
        assignmentAverage: 0
      };

      headers.forEach((header, i) => {
        const value = values[i];

        if (header.startsWith('assignment') && value && value !== '') {
          student.assignments.push(parseFloat(value) || 0);
        } else {
          switch (header) {
            case 'name':
              student.name = value;
              break;
            case 'attendanceRate':
              student.attendanceRate = parseFloat(value) || 0;
              break;
            case 'termAssessment1':
              student.termAssessment1 = parseFloat(value) || 0;
              break;
            case 'termAssessment2':
              student.termAssessment2 = parseFloat(value) || 0;
              break;
            case 'labMarks':
              student.labMarks = parseFloat(value) || 0;
              break;
            case 'labTotal':
              student.labTotal = parseFloat(value) || 0;
              break;
            case 'teacherRemark':
              student.teacherRemark = parseFloat(value) || 0;
              break;
            case 'previousSGPA':
              student.previousSGPA = value && value !== '' ? parseFloat(value) : undefined;
              break;
            case 'remarkCaption':
              student.remarkCaption = value || '';
              break;
          }
        }
      });

      // Calculate assignment average
      if (student.assignments.length > 0) {
        const totalObtained = student.assignments.reduce((sum: number, mark: number) => sum + mark, 0);
        const totalPossible = student.assignments.length * 10;
        student.assignmentAverage = (totalObtained / totalPossible) * 100;
      }

      student.id = `batch_${index + 1}`;
      return student as StudentData;
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsProcessing(true);

    try {
      const text = await file.text();
      const students = parseCSV(text);

      if (students.length === 0) {
        throw new Error('No valid student data found in the CSV file');
      }

      // Process predictions with delay for UX
      const predictions: PredictionResult[] = [];

      for (let i = 0; i < students.length; i++) {
        const student = students[i];
        const prediction = predictPerformance(student);
        predictions.push(prediction);

        // Add small delay for visual feedback
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      setResults(predictions);
      onBatchPredictions(predictions);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const downloadResults = () => {
    if (results.length === 0) return;

    const headers = [
      'Student Name',
      'Attendance Rate',
      'Assignment Average',
      'Term Assessment 1',
      'Term Assessment 2',
      'Lab Marks',
      'Lab Total',
      'Teacher Remark',
      'Remark Caption',
      'Previous SGPA',
      'Predicted CGPA',
      'Predicted Final Exam',
      'Risk Level',
      'Confidence',
      'Date'
    ];

    const csvContent = [
      headers.join(','),
      ...results.map(result => [
        result.student.name,
        result.student.attendanceRate,
        result.student.assignmentAverage.toFixed(1),
        result.student.termAssessment1,
        result.student.termAssessment2,
        result.student.labMarks,
        result.student.labTotal,
        result.student.teacherRemark,
        result.student.remarkCaption || '',
        result.student.previousSGPA || '',
        result.predictedCGPA.toFixed(2),
        result.predictedFinalExam.toFixed(0),
        result.riskLevel,
        (result.confidence * 100).toFixed(0) + '%',
        result.timestamp.toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student_predictions_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-6">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <Upload className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Batch Processing</h2>
              <p className="text-emerald-100 text-sm">Upload CSV files for bulk student analysis</p>
            </div>
          </div>
        </div>
        
        <div className="p-8">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Upload Section */}
            <div className="space-y-6">
              <div className="border-2 border-dashed border-emerald-300 rounded-xl p-8 text-center hover:border-emerald-400 transition-all duration-200 bg-gradient-to-br from-emerald-50 to-teal-50/50">
                <div className="bg-emerald-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Upload className="w-10 h-10 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">
                  Upload Student Data
                </h3>
                <p className="text-slate-600 mb-6 max-w-sm mx-auto">
                  Upload a CSV file with student information to generate bulk predictions
                </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isProcessing}
              />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-emerald-700 hover:to-teal-700 focus:ring-4 focus:ring-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  {isProcessing ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Processing...</span>
                    </div>
                  ) : (
                    'Select CSV File'
                  )}
                </button>
            </div>

              <div className="bg-gradient-to-br from-slate-50 to-blue-50/50 rounded-xl p-6 border border-slate-200/50">
                <h4 className="font-bold text-slate-800 mb-4 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>CSV Format Requirements</span>
                </h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>• Include headers: name, attendanceRate, assignment1-5, termAssessment1, termAssessment2, labMarks, labTotal, teacherRemark, remarkCaption, previousSGPA</li>
                <li>• Attendance rate: 0-100%</li>
                <li>• Assignments: 0-10 each (use 3-5 columns, leave empty for unused)</li>
                <li>• Term assessments: 0-20 each</li>
                <li>• Lab marks: obtained/total (total should be 20 or 30)</li>
                <li>• Teacher remark: 0-10 scale</li>
                <li>• Previous SGPA: 0-10 scale (optional)</li>
              </ul>

                <button
                  onClick={downloadSampleCSV}
                  className="mt-6 flex items-center space-x-2 bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg font-semibold transition-colors duration-200"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Sample CSV</span>
                </button>
              </div>

              {error && (
                <div className="bg-gradient-to-br from-red-50 to-pink-50/50 border-2 border-red-200 rounded-xl p-6">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="bg-red-100 p-2 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    </div>
                    <p className="text-red-800 font-bold">Error Processing File</p>
                  </div>
                  <p className="text-red-700 ml-10">{error}</p>
                </div>
              )}
            </div>

            {/* Results Section */}
            <div className="space-y-6">
              {results.length > 0 ? (
                <>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50/50 border-2 border-green-200 rounded-xl p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-green-800">Processing Complete</h3>
                        <p className="text-green-600 text-sm">All predictions generated successfully</p>
                      </div>
                    </div>
                  <p className="text-green-700 mb-4">
                    Successfully processed {results.length} student records
                  </p>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {results.filter(r => r.riskLevel === 'high').length}
                      </div>
                      <div className="text-sm text-slate-600">High Risk</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {results.filter(r => r.riskLevel === 'medium').length}
                      </div>
                      <div className="text-sm text-slate-600">Medium Risk</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {results.filter(r => r.riskLevel === 'low').length}
                      </div>
                      <div className="text-sm text-slate-600">Low Risk</div>
                    </div>
                  </div>

                    <button
                      onClick={downloadResults}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 focus:ring-4 focus:ring-green-500/20 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      <Download className="w-5 h-5 inline mr-2" />
                      Download Results CSV
                    </button>
                  </div>

                  <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-xl p-6 max-h-96 overflow-y-auto border border-slate-200/50">
                    <h4 className="font-bold text-slate-800 mb-4 sticky top-0 bg-gradient-to-br from-slate-50 to-blue-50/30 flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Prediction Summary</span>
                    </h4>
                    <div className="space-y-3">
                      {results.map((result, index) => (
                        <div key={index} className="bg-white/80 p-4 rounded-xl border border-slate-200/50 hover:shadow-md transition-shadow duration-200">
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="font-semibold text-slate-800">
                                {result.student.name}
                              </h5>
                              <div className="text-sm text-slate-600 mt-2 space-y-1">
                                <div>
                                  CGPA: <span className="font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                    {result.predictedCGPA.toFixed(2)}
                                  </span>
                                </div>
                                <div>
                                  Exam: <span className="font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                                    {result.predictedFinalExam.toFixed(0)}%
                                  </span>
                                </div>
                              </div>
                            </div>
                            <span className={`px-3 py-2 rounded-xl text-xs font-bold ${result.riskLevel === 'high'
                              ? 'bg-gradient-to-r from-red-100 to-red-200 text-red-800'
                              : result.riskLevel === 'medium'
                                ? 'bg-gradient-to-r from-yellow-100 to-orange-200 text-orange-800'
                                : 'bg-gradient-to-r from-green-100 to-green-200 text-green-800'
                              }`}>
                              {result.riskLevel} risk
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-xl p-12 text-center border border-slate-200/50">
                  <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FileText className="w-10 h-10 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">Ready for Processing</h3>
                  <p className="text-slate-600 max-w-md mx-auto">
                    Upload a CSV file to see batch processing results here
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

export default BatchProcessor;