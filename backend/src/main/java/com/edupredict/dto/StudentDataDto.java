package com.edupredict.dto;

import java.util.ArrayList;
import java.util.List;

public class StudentDataDto {
  public String id;
  public String name;
  public double attendanceRate = 0;
  public List<Double> assignments = new ArrayList<>();
  public double assignmentAverage;
  public double termAssessment1;
  public double termAssessment2;
  public double labMarks;
  public double labTotal = 30;
  public double teacherRemark;
  public String remarkCaption;
  public Double previousSGPA;
}
