package com.edupredict.portal;

import com.edupredict.dto.StudentDataDto;
import com.edupredict.dto.StudentPatchDto;
import com.edupredict.dto.StudentRecordDto;
import com.edupredict.prediction.PerformancePredictionService;
import com.edupredict.prediction.PredictionFeatureMath;
import com.edupredict.security.AuthPrincipal;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PortalRecordService {

  private final ObjectMapper mapper;
  private final StoredPortalRecordRepository repository;
  private final PerformancePredictionService performancePrediction;
  private final PortalStudentCredentialsService studentCredentials;

  public PortalRecordService(
      ObjectMapper mapper,
      StoredPortalRecordRepository repository,
      PerformancePredictionService performancePrediction,
      PortalStudentCredentialsService studentCredentials) {
    this.mapper = mapper;
    this.repository = repository;
    this.performancePrediction = performancePrediction;
    this.studentCredentials = studentCredentials;
  }

  public StudentRecordDto recompute(StudentRecordDto r) {
    if (r.data == null) r.data = new StudentDataDto();
    PredictionFeatureMath.enrichInPlace(r.data);
    r.prediction = performancePrediction.predictFromEnriched(r.data);
    if (r.cgpaSemesters == null || r.cgpaSemesters.isEmpty()) {
      r.cgpaSemesters = new ArrayList<>(performancePrediction.defaultCgpaSemesters());
    }
    r.cgpaHistory =
        new ArrayList<>(performancePrediction.cgpaTrend(r.prediction.predictedCGPA));
    return r;
  }

  @Transactional(readOnly = true)
  public Optional<StudentRecordDto> findByIdForUser(String id, AuthPrincipal principal) {
    if (id == null || id.isBlank()) {
      return Optional.empty();
    }
    Optional<StoredPortalRecord> row = repository.findById(id.strip());
    if (row.isEmpty()) {
      return Optional.empty();
    }
    StoredPortalRecord entity = row.get();
    if ("TEACHER".equalsIgnoreCase(principal.role())) {
      return Optional.of(deserialize(entity.getPayloadJson()));
    }
    if ("STUDENT".equalsIgnoreCase(principal.role())) {
      String roll = principal.studentRoll();
      if (roll == null || roll.isBlank()) {
        return Optional.empty();
      }
      if (!entity.getRollNumber().equalsIgnoreCase(roll.strip())) {
        return Optional.empty();
      }
      return Optional.of(deserialize(entity.getPayloadJson()));
    }
    return Optional.empty();
  }

  @Transactional(readOnly = true)
  public List<StudentRecordDto> loadAllTeacher() {
    List<StudentRecordDto> out = new ArrayList<>();
    for (StoredPortalRecord row : repository.findAll()) {
      out.add(deserialize(row.getPayloadJson()));
    }
    out.sort(
        Comparator.comparing(
                (StudentRecordDto a) ->
                    Optional.ofNullable(a.data).map(d -> d.name).orElse(""),
                String.CASE_INSENSITIVE_ORDER)
            .thenComparing(a -> Optional.ofNullable(a.rollNumber).orElse("")));
    return out;
  }

  @Transactional(readOnly = true)
  public List<StudentRecordDto> loadForStudentRoll(String roll) {
    if (roll == null || roll.isBlank()) {
      return List.of();
    }
    Optional<StoredPortalRecord> hit = repository.findByRollNumberIgnoreCase(roll.strip());
    return hit.map(r -> List.of(deserialize(r.getPayloadJson()))).orElse(List.of());
  }

  private StudentRecordDto deserialize(String json) {
    try {
      StudentRecordDto dto = mapper.readValue(json, StudentRecordDto.class);
      if (dto.id == null || dto.id.isBlank()) {
        throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Malformed record");
      }
      return dto;
    } catch (JsonProcessingException e) {
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Corrupt portal row", e);
    }
  }

  @Transactional
  public StudentRecordDto saveTeacherDraft(StudentRecordDto incoming) {
    if (incoming == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "missing body");
    if (incoming.rollNumber == null || incoming.rollNumber.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "rollNumber required");
    }
    if (incoming.data == null) incoming.data = new StudentDataDto();
    if (incoming.improvementActions == null) incoming.improvementActions = new ArrayList<>();
    if (incoming.data.name == null || incoming.data.name.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "data.name required");
    }

    Optional<StoredPortalRecord> staleBeforeWrite =
        incoming.id != null && !incoming.id.isBlank()
            ? repository.findById(incoming.id.strip())
            : Optional.empty();
    final String priorRoll =
        staleBeforeWrite
            .map(StoredPortalRecord::getRollNumber)
            .map(String::strip)
            .filter(r -> !r.isEmpty())
            .orElse(null);

    if (incoming.id == null || incoming.id.isBlank()) {
      incoming.id = UUID.randomUUID().toString();
    }

    recompute(incoming);
    persistSnapshot(incoming);

    StoredPortalRecord saved =
        repository
            .findById(incoming.id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "persist failed"));

    incoming.id = saved.getId();
    studentCredentials.syncAfterRosterSave(priorRoll, Objects.requireNonNull(incoming.rollNumber).strip());

    return incoming;
  }

  /**
   * Students may revise academic inputs (merged into {@code current.data}); teacher narrative & improvement checklist are
   * optional separate fields — when metrics change, GPA/risk recomputes on the server ML stack.
   */
  @Transactional
  public StudentRecordDto patchOwnedStudent(AuthPrincipal principal, String id, StudentPatchDto patch) {
    if (patch == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "body required");
    }
    if (!"STUDENT".equalsIgnoreCase(principal.role())) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "students only");
    }
    StudentRecordDto current =
        findByIdForUser(id, principal)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "record not accessible"));

    if (patch.improvementActions != null) {
      current.improvementActions = new ArrayList<>(patch.improvementActions);
    }
    if (patch.data != null) {
      mergeStudentMetricOverlay(current.data, patch.data);
      recompute(current);
    }

    persistSnapshot(current);
    return current;
  }

  private void mergeStudentMetricOverlay(StudentDataDto base, StudentDataDto overlay) {
    if (overlay == null) {
      return;
    }
    base.attendanceRate = overlay.attendanceRate;
    if (overlay.assignments != null) {
      base.assignments = new ArrayList<>(overlay.assignments);
    }
    base.termAssessment1 = overlay.termAssessment1;
    base.termAssessment2 = overlay.termAssessment2;
    base.labMarks = overlay.labMarks;
    if (overlay.labTotal > 0) {
      base.labTotal = overlay.labTotal;
    }
    base.teacherRemark = overlay.teacherRemark;
    if (overlay.remarkCaption != null) {
      base.remarkCaption = overlay.remarkCaption;
    }
    base.previousSGPA = overlay.previousSGPA;
  }

  private void persistSnapshot(StudentRecordDto incoming) {
    StoredPortalRecord row =
        repository.findById(incoming.id).orElse(new StoredPortalRecord(incoming.id, "", ""));
    row.setId(incoming.id);
    row.setRollNumber(incoming.rollNumber.strip());
    try {
      row.setPayloadJson(mapper.writeValueAsString(incoming));
    } catch (JsonProcessingException e) {
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "serialisation failed", e);
    }
    repository.save(row);
  }

  @Transactional
  public void deleteTeacher(String id) {
    if (id == null || id.isBlank()) {
      return;
    }
    String sid = id.strip();
    repository
        .findById(sid)
        .ifPresent(row -> studentCredentials.revokeStudentLoginByRoll(row.getRollNumber()));
    repository.deleteById(sid);
  }

  @Transactional
  public List<StudentRecordDto> saveTeacherBatch(List<StudentRecordDto> items) {
    if (items == null || items.isEmpty()) {
      return List.of();
    }
    List<StudentRecordDto> out = new ArrayList<>(items.size());
    for (StudentRecordDto dto : items) {
      out.add(saveTeacherDraft(dto));
    }
    return out;
  }

  @Transactional
  public void deleteAllTeacherRoster() {
    List<String> rolls =
        repository.findAll().stream()
            .map(StoredPortalRecord::getRollNumber)
            .filter(Objects::nonNull)
            .map(String::strip)
            .filter(r -> !r.isEmpty())
            .toList();
    studentCredentials.revokeAllForRolls(rolls);
    repository.deleteAll();
  }
}
