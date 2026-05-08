package com.edupredict.prediction;

import com.edupredict.dto.StudentDataDto;
import java.util.ArrayList;

/** Shared preprocessing so training data and inference use identical averages. */
public final class PredictionFeatureMath {

  private PredictionFeatureMath() {}

  /** Normalises assignment aggregates on {@code dto} in place (mirrors SPA logic). */
  public static StudentDataDto enrichInPlace(StudentDataDto s) {
    if (s.assignments == null) {
      s.assignments = new ArrayList<>();
    }
    double sum = s.assignments.stream().mapToDouble(Double::doubleValue).sum();
    int n = s.assignments.size();
    if (n == 0) {
      s.assignmentAverage = 72;
    } else {
      s.assignmentAverage = (sum / (n * 10d)) * 100d;
    }
    return s;
  }
}
