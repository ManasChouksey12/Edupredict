package com.edupredict.dto;

import java.util.List;

/** Student-facing partial update — {@code null} fields mean “leave unchanged”. */
public class StudentPatchDto {

  public List<ImprovementDto> improvementActions;

  public String teacherNarrative;

  /** When set, student-editable academic inputs are merged and prediction is recomputed server-side. */
  public StudentDataDto data;
}
