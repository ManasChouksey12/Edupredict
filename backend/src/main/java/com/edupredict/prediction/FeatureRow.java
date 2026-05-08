package com.edupredict.prediction;

import com.edupredict.dto.StudentDataDto;

/**
 * Engineered supervised-learning row: intercept + nonlinear interaction terms fed to regression / NB.
 */
final class FeatureRow {

  /** Column index (including intercept column 0) for debugging / telemetry docs. */
  static final int COL_IC = 0;

  private FeatureRow() {}

  /** Returns length 10 vector: intercept + derived terms. Caller must {@link PredictionFeatureMath#enrichInPlace}. */
  static double[] vectorWithIntercept(StudentDataDto s) {
    int nAssignments = s.assignments == null ? 0 : s.assignments.size();
    double attendance = s.attendanceRate;
    double assignPct = s.assignmentAverage;
    double ta1 = s.termAssessment1;
    double ta2 = s.termAssessment2;
    double termPct = (ta1 + ta2) / 40d * 100d;
    double labTotal = Math.max(1e-9, s.labTotal);
    double labPct = s.labMarks / labTotal * 100d;
    double remarkFrac = Math.max(0d, Math.min(s.teacherRemark, 10d)) / 10d;
    double prev =
        (s.previousSGPA != null ? s.previousSGPA : 7.5d) / 10d;

    double interactionSqrt = Math.sqrt(Math.max(attendance * assignPct, 0d));
    double assignSz = Math.min(1d, Math.max(nAssignments / 5d, 0d));
    double termSpreadNorm = Math.min(1d, Math.abs(ta1 - ta2) / 20d);

    return new double[] {
      1d,
      attendance / 100d,
      assignPct / 100d,
      termPct / 100d,
      labPct / 100d,
      remarkFrac,
      prev,
      interactionSqrt / 100d,
      assignSz,
      termSpreadNorm
    };
  }

  /** Drops intercept column — Naïve Bayes sees only covariates. */
  static double[] covariancePart(double[] interceptRow) {
    double[] xs = new double[interceptRow.length - 1];
    System.arraycopy(interceptRow, 1, xs, 0, interceptRow.length - 1);
    return xs;
  }
}
