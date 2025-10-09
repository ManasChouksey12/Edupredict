# 🎓 EduPredict - Student Performance Prediction System

A **deterministic AI-powered web application** for predicting student academic performance using **CGPA (0-10 scale)** and identifying at-risk students. Built with React, TypeScript, and Tailwind CSS.

## 🚀 Live Demo

**[https://smartgpa.netlify.app/](https://smartgpa.netlify.app/)**

## 🌟 Key Features

- **Single Student Prediction**: Individual student CGPA predictions
- **Batch Processing**: CSV upload for multiple students  
- **Interactive Dashboard**: Real-time analytics and metrics
- **Risk Assessment**: Automatic identification of at-risk students
- **100% Deterministic**: Consistent, reproducible results
- **Export Capabilities**: Download results in CSV format

## 📋 Input Parameters

The system analyzes **7 key academic factors** using a weighted regression model:

| **Factor** | **Scale** | **Weight** | **Description** |
|------------|-----------|------------|-----------------|
| **Attendance Rate** | 0-100% | 25% | Class attendance percentage |
| **Assignment Average** | 0-100% | 20% | Average of 3-5 assignments (each out of 10) |
| **Term Assessment 1** | 0-20 | 15% | Mid-term assessment score |
| **Term Assessment 2** | 0-20 | 15% | Second term assessment score |
| **Lab Marks** | Variable | 10% | Practical/lab performance (out of 20 or 30) |
| **Teacher Remark** | 0-10 | 8% | Instructor evaluation score |
| **Previous SGPA** | 0-10 | 7% | Historical academic performance (optional) |

## 🧮 Machine Learning Model

### **Algorithm: Deterministic Weighted Linear Regression**

The system uses a **100% deterministic** weighted linear regression model:

```typescript
// Step 1: Normalize all inputs to percentage scale (0-100%)
const normalizedScore = (
  attendanceRate * 0.25 +
  assignmentAverage * 0.20 +
  (termAssessment1 / 20) * 100 * 0.15 +
  (termAssessment2 / 20) * 100 * 0.15 +
  (labMarks / labTotal) * 100 * 0.10 +
  (teacherRemark / 10) * 100 * 0.08 +
  (previousSGPA / 10) * 100 * 0.07
);

// Step 2: Convert to CGPA (0-10 scale)
const predictedCGPA = (normalizedScore / 100) * 10;

// Step 3: Calculate final exam score
const finalExamScore = Math.round(predictedCGPA * 10);
```

### **Risk Assessment**

| **Risk Level** | **Criteria** | **CGPA Threshold** |
|----------------|--------------|-------------------|
| **🔴 High Risk** | CGPA < 4.0 OR 4+ risk factors | < 4.0 |
| **🟡 Medium Risk** | CGPA < 6.5 OR 2+ risk factors | 4.0 - 6.4 |
| **🟢 Low Risk** | Good performance across factors | ≥ 6.5 |

## 🛠️ Technology Stack

- **React 18.3.1**: Modern React with TypeScript
- **TypeScript 5.5.3**: Full type safety
- **Tailwind CSS 3.4.1**: Responsive design
- **Vite 5.4.2**: Fast build tool
- **Chart.js 4.4.0**: Interactive charts
- **PapaParse 5.4.1**: CSV processing

## 🚀 Getting Started

### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/edupredict.git
   cd edupredict
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

## 📊 Usage Guide

### 1️⃣ Single Student Prediction
1. Navigate to "Single Prediction" tab
2. Enter student information (name, attendance, assignments, etc.)
3. Click "Predict Performance"
4. View predicted CGPA, final exam score, and risk level

### 2️⃣ Batch Processing
1. Go to "Batch Processing" tab
2. Download sample CSV template
3. Fill in student data following the format
4. Upload CSV file
5. Download results with all predictions

### 3️⃣ Analytics Dashboard
1. Visit "Analytics" tab after making predictions
2. View performance metrics and distributions
3. Analyze risk levels and factor impacts

## 📝 CSV Format

```csv
name,attendanceRate,assignment1,assignment2,assignment3,assignment4,assignment5,termAssessment1,termAssessment2,labMarks,labTotal,teacherRemark,remarkCaption,previousSGPA
John Smith,85,9,8.5,9.5,9,,18,19,25,30,9,Excellent work,8.2
Sarah Johnson,92,9.5,9,9.5,10,8.5,19,20,28,30,10,Outstanding performance,8.8
```

### Field Specifications

| **Field** | **Type** | **Range** | **Required** |
|-----------|----------|-----------|--------------|
| `name` | String | - | ✅ |
| `attendanceRate` | Number | 0-100 | ✅ |
| `assignment1-5` | Number | 0-10 | ✅ (min 3) |
| `termAssessment1` | Number | 0-20 | ✅ |
| `termAssessment2` | Number | 0-20 | ✅ |
| `labMarks` | Number | 0-30 | ✅ |
| `labTotal` | Number | 20 or 30 | ✅ |
| `teacherRemark` | Number | 0-10 | ✅ |
| `remarkCaption` | String | - | ❌ |
| `previousSGPA` | Number | 0-10 | ❌ |

## 🧠 AI/ML Technical Implementation

### **TypeScript Benefits**
- **Type Safety**: Compile-time error prevention
- **Data Integrity**: Structured interfaces for all data
- **Performance**: Optimized calculations with memoization
- **Maintainability**: Clean, readable code architecture

### **Core Prediction Algorithm**
```typescript
export const predictPerformance = (student: StudentData): PredictionResult => {
  // Calculate assignment average
  const assignmentAvgPercent = (assignmentSum / (assignmentCount * 10)) * 100;
  
  // Apply weighted formula
  const weightedPercent = 
    student.attendanceRate * 0.25 +
    assignmentAvgPercent * 0.20 +
    (student.termAssessment1 / 20) * 100 * 0.15 +
    (student.termAssessment2 / 20) * 100 * 0.15 +
    (student.labMarks / student.labTotal) * 100 * 0.10 +
    (student.teacherRemark / 10) * 100 * 0.08 +
    ((student.previousSGPA || 7.5) / 10) * 100 * 0.07;
  
  // Convert to CGPA and calculate results
  const predictedCGPA = (weightedPercent / 100) * 10;
  const finalExamScore = Math.round(predictedCGPA * 10);
  const riskLevel = calculateRiskLevel(student, predictedCGPA);
  
  return { predictedCGPA, finalExamScore, riskLevel, ... };
};
```

### **Data Validation**
```typescript
interface StudentData {
  name: string;
  attendanceRate: number;        // 0-100%
  assignments: number[];         // 3-5 assignments (0-10 each)
  termAssessment1: number;       // 0-20
  termAssessment2: number;       // 0-20
  labMarks: number;              // Obtained marks
  labTotal: number;              // Total marks (20 or 30)
  teacherRemark: number;         // 0-10
  remarkCaption?: string;        // Optional
  previousSGPA?: number;         // 0-10 (optional)
}
```

## 🎯 Use Cases

- **Educational Institutions**: Early intervention and resource allocation
- **Teachers**: Student assessment and parent communication
- **Academic Researchers**: Performance analysis and intervention studies
- **Administrative Staff**: Enrollment planning and support services

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the **MIT License**.

## 🙏 Acknowledgments

- **React Team** for the excellent framework
- **Tailwind CSS** for the utility-first CSS framework
- **TypeScript Team** for type safety
- **Educational Research Community** for insights into student performance factors

---

**🎓 EduPredict - Empowering Education Through Predictive Analytics**