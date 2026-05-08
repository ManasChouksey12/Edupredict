package com.edupredict.prediction;

import com.edupredict.dto.StudentDataDto;
import jakarta.annotation.PostConstruct;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ThreadLocalRandom;
import org.apache.commons.math3.linear.DecompositionSolver;
import org.apache.commons.math3.linear.MatrixUtils;
import org.apache.commons.math3.linear.QRDecomposition;
import org.apache.commons.math3.linear.RealMatrix;
import org.apache.commons.math3.linear.RealVector;
import org.springframework.stereotype.Component;

/**
 * Trains supervised models at startup — ordinary least-squares QR regression plus diagonal Gaussian naive Bayes for risk
 * — on a sizeable synthetic-labelled academic cohort suitable for demos and coursework walkthroughs.
 */
@Component
public class AcademicMlEngine {

  /** Intercept + nine engineered nonlinear covariates. */
  private static final int P = 10;

  public enum RiskClass {
    LOW,
    MEDIUM,
    HIGH
  }

  private RealVector coeffs;
  private GaussianRiskNb riskNb;

  private final Map<String, Object> telemetry = new LinkedHashMap<>();

  public Map<String, Object> telemetrySnapshot() {
    return Map.copyOf(telemetry);
  }

  /** Requires {@link PredictionFeatureMath#enrichInPlace(StudentDataDto)} on {@code s}. */
  public double predictCgpa(StudentDataDto s) {
    Objects.requireNonNull(s);
    RealVector xv = MatrixUtils.createRealVector(FeatureRow.vectorWithIntercept(s));
    return clamp(xv.dotProduct(coeffs), 0d, 10d);
  }

  /** Requires enrichment (same rule as regression). */
  public RiskClass predictRiskClass(StudentDataDto s) {
    double[] p = posteriorRisks(s);
    int k = argmax(p);
    return switch (k) {
      case 2 -> RiskClass.HIGH;
      case 1 -> RiskClass.MEDIUM;
      default -> RiskClass.LOW;
    };
  }

  /** Naïve Bayes softmax peak — surfaced as probabilistic calibration for the SPA. */
  public double posteriorMax(StudentDataDto s) {
    double[] p = posteriorRisks(s);
    return Math.max(p[0], Math.max(p[1], p[2]));
  }

  /** Calibrated class probabilities (low, medium, high) for narrative / ranking uses. */
  public double[] riskPosteriors(StudentDataDto s) {
    return posteriorRisks(s);
  }

  private double[] posteriorRisks(StudentDataDto s) {
    return riskNb.posteriors(FeatureRow.covariancePart(FeatureRow.vectorWithIntercept(s)));
  }

  private static int argmax(double[] p) {
    int mi = 0;
    for (int i = 1; i < p.length; i++) {
      if (p[i] > p[mi]) {
        mi = i;
      }
    }
    return mi;
  }

  @PostConstruct
  void fitSyntheticSupervisedDataset() {
    ThreadLocalRandom rng = ThreadLocalRandom.current();
    final int n = 10_000;
    final int fold = (int) (n * 0.80);

    RealMatrix Xm = MatrixUtils.createRealMatrix(n, P);
    double[] yCgpa = new double[n];
    int[] yRisk = new int[n];

    for (int i = 0; i < n; i++) {
      StudentDataDto s = syntheticStudent(rng);
      PredictionFeatureMath.enrichInPlace(s);
      double cgpa = latentCgpaWithNoise(s, rng);
      yCgpa[i] = cgpa;
      yRisk[i] = latentDiscreteRiskBand(cgpa, s);

      double[] row = FeatureRow.vectorWithIntercept(s);
      for (int j = 0; j < P; j++) {
        Xm.setEntry(i, j, row[j]);
      }
    }

    RealMatrix trainX = Xm.getSubMatrix(0, fold - 1, 0, P - 1);
    RealVector trainY = subsetY(yCgpa, 0, fold);
    QRDecomposition qr = new QRDecomposition(trainX);
    DecompositionSolver solver = qr.getSolver();
    coeffs = solver.solve(trainY);

    RealMatrix covTrain = Xm.getSubMatrix(0, fold - 1, 1, P - 1);
    int[] yTrainRisk = Arrays.copyOfRange(yRisk, 0, fold);
    riskNb = GaussianRiskNb.fit(covTrain, yTrainRisk);

    double sse = 0;
    for (int i = fold; i < n; i++) {
      double pred =
          clamp(Xm.getRowVector(i).dotProduct(coeffs), 0d, 10d);
      double delta = yCgpa[i] - pred;
      sse += delta * delta;
    }
    double holdRmse = Math.sqrt(sse / (n - fold));

    int correct = 0;
    int holdCount = n - fold;
    for (int i = fold; i < n; i++) {
      RealVector xv = Xm.getRowVector(i).getSubVector(1, P - 1);
      int predLbl = riskNb.argmaxLabel(xv.toArray());
      if (predLbl == yRisk[i]) {
        correct++;
      }
    }
    double acc = correct / (double) holdCount;

    telemetry.put("regressor", "ordinary least squares (QR decomposition)");
    telemetry.put(
        "classifier",
        "Gaussian naive Bayes (diagonal covariance, Laplace-smoothed class priors & variances)");
    telemetry.put("supervisedSyntheticSamples", n);
    telemetry.put("trainRows", fold);
    telemetry.put("holdoutRows", holdCount);
    telemetry.put("holdoutCgpaRmse", Math.round(holdRmse * 1000d) / 1000d);
    telemetry.put("holdoutRiskAccuracy", Math.round(acc * 1000d) / 1000d);
    telemetry.put(
        "labelNote",
        "labels emerge from differentiable blends + stochastic noise plus interpretable thresholds");
  }

  private static RealVector subsetY(double[] y, int from, int uptoExclusive) {
    double[] slice = Arrays.copyOfRange(y, from, uptoExclusive);
    return MatrixUtils.createRealVector(slice);
  }

  private static StudentDataDto syntheticStudent(ThreadLocalRandom r) {
    StudentDataDto d = new StudentDataDto();
    d.attendanceRate = bounded(r, 40, 99.9);
    int assignCount = boundedInt(r, 3, 6);
    List<Double> marks = new ArrayList<>(assignCount);
    for (int j = 0; j < assignCount; j++) {
      marks.add(bounded(r, 3d, 10d));
    }
    d.assignments = marks;
    d.termAssessment1 = bounded(r, 5, 20);
    d.termAssessment2 = bounded(r, 5, 20);
    double labTot = r.nextBoolean() ? 20d : 30d;
    d.labTotal = labTot;
    d.labMarks = bounded(r, labTot * 0.2, labTot);
    d.teacherRemark = bounded(r, 2d, 10d);
    d.previousSGPA = r.nextDouble() < 0.12 ? null : bounded(r, 4.2, 9.6);
    d.remarkCaption = "Synthetic training row";
    d.name = "synth-" + r.nextLong(999_999L);
    return d;
  }

  /** Differentiable latent CGPA surrogate with stochastic coupling for realism + identifiability. */
  private static double latentCgpaWithNoise(StudentDataDto s, ThreadLocalRandom r) {
    double attendPct = s.attendanceRate;
    double assignmentPctAvg = s.assignmentAverage;
    double termPct = (s.termAssessment1 + s.termAssessment2) / 40d * 100d;
    double labPct = s.labTotal > 1e-6 ? s.labMarks / s.labTotal * 100d : 65d;
    double remarkFrac = Math.max(s.teacherRemark, 0d) / 10d;
    double prev = s.previousSGPA != null ? s.previousSGPA : 7.2d;

    double base =
        attendPct / 100d * 0.24 * 10d
            + assignmentPctAvg / 100d * 0.20 * 10d
            + termPct / 100d * 0.24 * 10d
            + labPct / 100d * 0.12 * 10d
            + remarkFrac * 0.10 * 10d
            + prev / 10d * 0.075 * 10d;

    base += Math.sin(assignmentPctAvg / 120d * Math.PI) * 0.52;
    base += Math.cos(attendPct / 110d * Math.PI) * 0.32;
    base += Math.sqrt(Math.max(assignSz(s), 0d)) * 0.055;
    base += Math.min(Math.abs(s.termAssessment1 - s.termAssessment2) / 20d, 1d) * 0.10;
    base += r.nextGaussian() * 0.53;
    return clamp(base, 0d, 10d);
  }

  /** Maps latent CGPA plus raw signals into ordered risk strata for multiclass probabilistic modelling. */
  private static int latentDiscreteRiskBand(double cgpaTruth, StudentDataDto s) {
    int penal = 0;
    if (cgpaTruth < 5d) penal += 2;
    else if (cgpaTruth < 6d) penal++;
    if (s.attendanceRate < 72) penal++;
    if (s.assignmentAverage < 65) penal++;
    double taAvg = (s.termAssessment1 + s.termAssessment2) / 2d;
    if (taAvg < 12d) penal++;
    double labPct = s.labMarks / Math.max(s.labTotal, 1d) * 100d;
    if (labPct < 54) penal++;
    if (s.teacherRemark < 4d) penal++;
    if (s.previousSGPA != null && s.previousSGPA < 5.2) penal++;
    if (penal >= 4) {
      return 2;
    }
    if (penal >= 2) {
      return 1;
    }
    return 0;
  }

  private static double assignSz(StudentDataDto s) {
    return (s.assignments == null ? 3 : Math.max(s.assignments.size(), 3)) / 6d;
  }

  private static double bounded(ThreadLocalRandom r, double low, double high) {
    return r.nextDouble(low, high + 1e-6);
  }

  private static int boundedInt(ThreadLocalRandom r, int lo, int hi) {
    return r.nextInt(lo, hi + 1);
  }

  static double clamp(double value, double lo, double hi) {
    return Math.min(hi, Math.max(lo, value));
  }

  /** Diagonal covariance Gaussian naive Bayes for three strata. */
  private static final class GaussianRiskNb {
    static final double VAR_FLOOR = 3e-3;
    static final double PRIOR_EPS = 0.08;

    private final double[][] mean; // cxj
    private final double[][] var; // smoothed diagonal
    private final double[] logPrior;

    private GaussianRiskNb(double[][] mean, double[][] var, double[] logPrior) {
      this.mean = mean;
      this.var = var;
      this.logPrior = logPrior;
    }

    static GaussianRiskNb fit(RealMatrix x, int[] yRisk) {
      int nTrain = x.getRowDimension();
      int fCols = x.getColumnDimension();

      int[][] members = new int[3][nTrain];
      int[] counts = new int[3];

      double[][] sums = new double[3][fCols];
      for (int i = 0; i < nTrain; i++) {
        int lbl = clampLabel(yRisk[i]);
        members[lbl][counts[lbl]] = i;
        counts[lbl]++;
        RealVector xv = x.getRowVector(i);
        for (int j = 0; j < fCols; j++) {
          sums[lbl][j] += xv.getEntry(j);
        }
      }

      double[][] mu = new double[3][fCols];
      for (int c = 0; c < 3; c++) {
        if (counts[c] == 0) {
          throw new IllegalStateException("risk class collapsed during synthetic generation");
        }
        for (int j = 0; j < fCols; j++) {
          mu[c][j] = sums[c][j] / counts[c];
        }
      }

      double[][] variance = new double[3][fCols];
      for (int c = 0; c < 3; c++) {
        for (int j = 0; j < fCols; j++) {
          double acc = 0;
          int cnt = counts[c];
          for (int r = 0; r < cnt; r++) {
            int ri = members[c][r];
            double diff = x.getRowVector(ri).getEntry(j) - mu[c][j];
            acc += diff * diff;
          }
          double v = cnt > 1 ? acc / cnt : PRIOR_EPS;
          variance[c][j] = Math.max(v, VAR_FLOOR);
        }
      }

      double[] logPriorVals = new double[3];
      for (int c = 0; c < 3; c++) {
        double smoothedPrior = ((double) counts[c] + PRIOR_EPS) / (nTrain + 3 * PRIOR_EPS);
        logPriorVals[c] = Math.log(smoothedPrior);
      }
      return new GaussianRiskNb(mu, variance, logPriorVals);
    }

    private static int clampLabel(int y) {
      if (y < 0 || y > 2) {
        throw new IllegalArgumentException("unsupported label");
      }
      return y;
    }

    /** Returns calibrated class probabilities summing to 1 with log-sum-exp stabilisation. */
    double[] posteriors(double[] xRow) {
      double[] logits = new double[3];
      for (int c = 0; c < 3; c++) {
        double lp = logPrior[c];
        for (int j = 0; j < xRow.length; j++) {
          double diff = xRow[j] - mean[c][j];
          lp += -0.5 * Math.log(2 * Math.PI * var[c][j]) - (diff * diff) / (2 * var[c][j]);
        }
        logits[c] = lp;
      }
      double max = Math.max(logits[0], Math.max(logits[1], logits[2]));
      double[] exp = new double[3];
      double sum = 0;
      for (int i = 0; i < 3; i++) {
        exp[i] = Math.exp(logits[i] - max);
        sum += exp[i];
      }
      for (int i = 0; i < 3; i++) {
        exp[i] /= sum;
      }
      return exp;
    }

    int argmaxLabel(double[] xv) {
      return AcademicMlEngine.argmax(posteriors(xv));
    }
  }
}
