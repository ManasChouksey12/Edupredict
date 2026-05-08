package com.edupredict.dto;

import java.util.ArrayList;
import java.util.List;

public class StudentRecordDto {
  public String id;
  public String rollNumber;
  public String program;
  public StudentDataDto data = new StudentDataDto();
  public PredictionDto prediction;
  public String teacherNarrative;
  public List<ImprovementDto> improvementActions = new ArrayList<>();
  public List<String> cgpaSemesters = new ArrayList<>();
  public List<Double> cgpaHistory = new ArrayList<>();
}
