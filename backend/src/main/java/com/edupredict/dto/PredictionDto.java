package com.edupredict.dto;

import java.time.Instant;
import java.util.List;

public class PredictionDto {
  public StudentDataDto student;
  public double predictedCGPA;
  public double predictedFinalExam;
  public String riskLevel;
  public double confidence;
  public List<String> recommendations;
  public Instant timestamp;
}
