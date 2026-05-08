package com.edupredict.web;

import com.edupredict.dto.PredictionDto;
import com.edupredict.dto.StudentDataDto;
import com.edupredict.prediction.AcademicMlEngine;
import com.edupredict.prediction.PerformancePredictionService;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Served predictions come from JVM-fitted supervised models (OLS + Gaussian Naïve Bayes) — see `/api/ml/info`. */
@RestController
@RequestMapping("/api/ml")
public class PredictMlController {

  private final PerformancePredictionService predictor;
  private final AcademicMlEngine ml;

  public PredictMlController(PerformancePredictionService predictor, AcademicMlEngine ml) {
    this.predictor = predictor;
    this.ml = ml;
  }

  @GetMapping("/info")
  @PreAuthorize("isAuthenticated()")
  public Map<String, Object> modelInfo() {
    Map<String, Object> out = new LinkedHashMap<>();
    out.putAll(ml.telemetrySnapshot());
    out.put(
        "recommendations",
        "OLS counterfactual marginal lifts (+ Gaussian NB risk posteriors) — numbers from the JVM-fitted surfaces");
    out.put(
        "outputs",
        Map.of(
            "predictedCGPA", "[0..10] least-squares regressor fitted on labelled synthetic telemetry",
            "riskLevel",
                "multiclass probabilistic strata from diagonal Gaussian naive Bayes (low | medium | high)",
            "confidence", "posterior softmax peak scaled for UI readability"));
    return out;
  }

  @PostMapping("/predict")
  @PreAuthorize("isAuthenticated()")
  public PredictionDto predict(@RequestBody StudentDataDto body) {
    return predictor.predict(body);
  }

  @PostMapping("/predict/batch")
  @PreAuthorize("isAuthenticated()")
  public List<PredictionDto> predictBatch(@RequestBody List<StudentDataDto> students) {
    if (students == null || students.isEmpty()) {
      return List.of();
    }
    List<PredictionDto> out = new ArrayList<>(students.size());
    for (StudentDataDto dto : students) {
      StudentDataDto copy = copyForPredict(dto);
      out.add(predictor.predict(copy));
    }
    return out;
  }

  private static StudentDataDto copyForPredict(StudentDataDto s) {
    StudentDataDto c = new StudentDataDto();
    c.id = s.id;
    c.name = s.name;
    c.attendanceRate = s.attendanceRate;
    c.assignments = s.assignments == null ? new ArrayList<>() : new ArrayList<>(s.assignments);
    c.assignmentAverage = s.assignmentAverage;
    c.termAssessment1 = s.termAssessment1;
    c.termAssessment2 = s.termAssessment2;
    c.labMarks = s.labMarks;
    c.labTotal = s.labTotal;
    c.teacherRemark = s.teacherRemark;
    c.remarkCaption = s.remarkCaption;
    c.previousSGPA = s.previousSGPA;
    return c;
  }
}
