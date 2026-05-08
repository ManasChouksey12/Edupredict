package com.edupredict.prediction;

import com.edupredict.dto.PredictionDto;
import com.edupredict.dto.StudentDataDto;
import com.edupredict.prediction.AcademicMlEngine.RiskClass;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.function.Consumer;
import org.springframework.stereotype.Service;

@Service
public class PerformancePredictionService {

  private final AcademicMlEngine ml;

  public PerformancePredictionService(AcademicMlEngine ml) {
    this.ml = ml;
  }

  /** Same labels as frontend `DEFAULT_SEMESTERS`. */
  public List<String> defaultCgpaSemesters() {
    return List.of("Sem 1", "Sem 2", "Sem 3", "Sem 4", "Sem 5");
  }

  /** Builds five-point GPA trend culminating near predicted CGPA. */
  public List<Double> cgpaTrend(double predictedCgpa) {
    double t = clamp(predictedCgpa, 0, 10);
    double start = Math.max(4, Math.min(t - 1.15, t - 0.35));
    int n = 5;
    List<Double> out = new ArrayList<>(n);
    for (int i = 0; i < n; i++) {
      double p = n <= 1 ? 1 : (double) i / (n - 1);
      double v = start + (t - start) * p;
      double rounded = clamp(v, 0, 10);
      out.add(Math.round(rounded * 100.0) / 100.0);
    }
    return out;
  }

  /**
   * Applies {@link PredictionFeatureMath#enrichInPlace(StudentDataDto)} then fits ML outputs (OLS CGPA +
   * Gaussian Naïve Bayes risk plus counterfactual lifts on the regressor surface).
   */
  public PredictionDto predict(StudentDataDto raw) {
    StudentDataDto body = dup(raw);
    PredictionFeatureMath.enrichInPlace(body);
    return buildPredictionDto(body);
  }

  /** Use when callers already enriched the same instance (portal saves/recompute pipeline). */
  public PredictionDto predictFromEnriched(StudentDataDto alreadyEnriched) {
    PredictionFeatureMath.enrichInPlace(alreadyEnriched); // idempotent on averages
    return buildPredictionDto(alreadyEnriched);
  }

  private PredictionDto buildPredictionDto(StudentDataDto s) {
    double predictedCGPA = ml.predictCgpa(s);
    RiskClass risk = ml.predictRiskClass(s);
    String riskLevel =
        switch (risk) {
          case HIGH -> "high";
          case MEDIUM -> "medium";
          default -> "low";
        };

    List<String> recommendations = buildMlCounterfactualRecommendations(s);
    double posterior = ml.posteriorMax(s);
    double confidenceDecimal = AcademicMlEngine.clamp(0.1 + posterior * 0.85, 0.54, 0.93);

    PredictionDto out = new PredictionDto();
    out.student = s;
    out.predictedCGPA = predictedCGPA;
    out.predictedFinalExam = (int) Math.round(predictedCGPA * 10);
    out.riskLevel = riskLevel;
    out.confidence = confidenceDecimal;
    out.recommendations = recommendations;
    out.timestamp = Instant.now();
    return out;
  }

  private static StudentDataDto dup(StudentDataDto o) {
    StudentDataDto c = new StudentDataDto();
    c.id = o.id;
    c.name = o.name;
    c.attendanceRate = o.attendanceRate;
    c.assignments = o.assignments == null ? new ArrayList<>() : new ArrayList<>(o.assignments);
    c.assignmentAverage = o.assignmentAverage;
    c.termAssessment1 = o.termAssessment1;
    c.termAssessment2 = o.termAssessment2;
    c.labMarks = o.labMarks;
    c.labTotal = o.labTotal;
    c.teacherRemark = o.teacherRemark;
    c.remarkCaption = o.remarkCaption;
    c.previousSGPA = o.previousSGPA;
    return c;
  }

  private record Counterfactual(String label, double delta) {}

  /**
   * Ranks remedial focus by finite-difference lift on {@link AcademicMlEngine#predictCgpa(StudentDataDto)} (trained OLS
   * surface); intro line uses NB posteriors. No static rubric prose — wording only reflects modeled quantities.
   */
  private List<String> buildMlCounterfactualRecommendations(StudentDataDto enrichedBaseline) {
    double baselineCgpa = ml.predictCgpa(enrichedBaseline);
    double[] pr = ml.riskPosteriors(enrichedBaseline);

    List<String> out = new ArrayList<>();
    out.add(
        String.format(
            Locale.US,
            "Fitted OLS CGPA estimate %.3f; Gaussian NB risk posterior — LOW %.1f%% / MEDIUM %.1f%% / HIGH %.1f%%.",
            baselineCgpa,
            pr[0] * 100,
            pr[1] * 100,
            pr[2] * 100));

    List<Counterfactual> ranked = new ArrayList<>();
    scoreCounterfactual(
        ranked,
        enrichedBaseline,
        baselineCgpa,
        "attendance +4 points (capped at 99)",
        d -> d.attendanceRate = clamp(d.attendanceRate + 4, 0, 99));
    scoreCounterfactual(
        ranked,
        enrichedBaseline,
        baselineCgpa,
        "each assignment mark +0.5 (capped at 10)",
        d -> {
          if (d.assignments == null || d.assignments.isEmpty()) {
            return;
          }
          List<Double> next = new ArrayList<>(d.assignments.size());
          for (Double m : d.assignments) {
            next.add(clamp(m + 0.5, 0, 10));
          }
          d.assignments = next;
        });
    scoreCounterfactual(
        ranked,
        enrichedBaseline,
        baselineCgpa,
        "each term assessment +1.5 marks (capped at 20)",
        d -> {
          d.termAssessment1 = clamp(d.termAssessment1 + 1.5, 0, 20);
          d.termAssessment2 = clamp(d.termAssessment2 + 1.5, 0, 20);
        });
    scoreCounterfactual(
        ranked,
        enrichedBaseline,
        baselineCgpa,
        "lab marks +max(1, 7%% of lab total) (capped at total)",
        d -> {
          double step = Math.max(1, d.labTotal * 0.07);
          d.labMarks = clamp(d.labMarks + step, 0, d.labTotal);
        });
    scoreCounterfactual(
        ranked,
        enrichedBaseline,
        baselineCgpa,
        "teacher remark +0.7 (capped at 10)",
        d -> d.teacherRemark = clamp(d.teacherRemark + 0.7, 0, 10));
    scoreCounterfactual(
        ranked,
        enrichedBaseline,
        baselineCgpa,
        "prior SGPA +0.55 (or fixed 7.9 if previously unset)",
        d -> {
          if (d.previousSGPA != null) {
            d.previousSGPA = clamp(d.previousSGPA + 0.55, 0, 10);
          } else {
            d.previousSGPA = 7.9;
          }
        });

    ranked.sort(Comparator.comparingDouble(Counterfactual::delta).reversed());

    int cap = Math.min(ranked.size(), 6);
    for (int i = 0; i < cap; i++) {
      Counterfactual c = ranked.get(i);
      out.add(
          String.format(
              Locale.US,
              "Single-perturbation counterfactual (%s): modeled CGPA lift %+0.3f vs baseline on OLS response.",
              c.label(),
              c.delta()));
    }

    if (ranked.isEmpty()) {
      out.add(
          String.format(
              Locale.US,
              "Probed marginal nudges yielded no modeled CGPA increase above baseline %.3f (flat or clipped region).",
              baselineCgpa));
    }

    out.add(
        "Method: independent one-at-a-time probes on enriched inputs feeding the JVM-fitted QR regressor (+ NB probabilities above).");
    return out;
  }

  private void scoreCounterfactual(
      List<Counterfactual> sink,
      StudentDataDto enrichedBase,
      double baselineCgpa,
      String label,
      Consumer<StudentDataDto> perturb) {
    StudentDataDto c = dup(enrichedBase);
    perturb.accept(c);
    PredictionFeatureMath.enrichInPlace(c);
    double y = ml.predictCgpa(c);
    double delta = y - baselineCgpa;
    if (delta > 1e-4) {
      sink.add(new Counterfactual(label, delta));
    }
  }
  static double clamp(double n, double lo, double hi) {
    return Math.min(hi, Math.max(lo, n));
  }
}
