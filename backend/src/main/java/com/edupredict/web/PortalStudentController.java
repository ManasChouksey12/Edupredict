package com.edupredict.web;

import com.edupredict.dto.StudentPatchDto;
import com.edupredict.dto.StudentRecordDto;
import com.edupredict.portal.PortalRecordService;
import com.edupredict.security.AuthPrincipal;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/portal/students")
public class PortalStudentController {

  private final PortalRecordService portalRecordService;

  public PortalStudentController(PortalRecordService portalRecordService) {
    this.portalRecordService = portalRecordService;
  }

  @GetMapping
  @PreAuthorize("isAuthenticated()")
  public List<StudentRecordDto> list(@AuthenticationPrincipal AuthPrincipal principal) {
    if ("TEACHER".equalsIgnoreCase(principal.role())) {
      return portalRecordService.loadAllTeacher();
    }
    if ("STUDENT".equalsIgnoreCase(principal.role())) {
      return portalRecordService.loadForStudentRoll(principal.studentRoll());
    }
    return List.of();
  }

  /** Single student — teacher: any id; student: only own roll. */
  @GetMapping("/{id}")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<StudentRecordDto> getOne(
      @PathVariable String id, @AuthenticationPrincipal AuthPrincipal principal) {
    return portalRecordService
        .findByIdForUser(id, principal)
        .map(ResponseEntity::ok)
        .orElseGet(() -> ResponseEntity.notFound().build());
  }

  @PatchMapping("/{id}")
  @PreAuthorize("hasRole('STUDENT')")
  public ResponseEntity<StudentRecordDto> patchOwned(
      @PathVariable String id,
      @AuthenticationPrincipal AuthPrincipal principal,
      @RequestBody StudentPatchDto body) {
    if (body == null) {
      return ResponseEntity.badRequest().build();
    }
    return ResponseEntity.ok(portalRecordService.patchOwnedStudent(principal, id, body));
  }

  @PostMapping("/batch")
  @PreAuthorize("hasRole('TEACHER')")
  public List<StudentRecordDto> batchUpsert(@RequestBody List<StudentRecordDto> body) {
    return portalRecordService.saveTeacherBatch(body);
  }

  @PostMapping
  @PreAuthorize("hasRole('TEACHER')")
  public StudentRecordDto create(@RequestBody StudentRecordDto body) {
    return portalRecordService.saveTeacherDraft(body);
  }

  @PutMapping("/{id}")
  @PreAuthorize("hasRole('TEACHER')")
  public StudentRecordDto replace(@PathVariable String id, @RequestBody StudentRecordDto body) {
    body.id = id;
    return portalRecordService.saveTeacherDraft(body);
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("hasRole('TEACHER')")
  public ResponseEntity<Void> delete(@PathVariable String id) {
    portalRecordService.deleteTeacher(id);
    return ResponseEntity.noContent().build();
  }

  /** Clears roster (teacher only). Query param distinguishes from `DELETE /{id}` (see Spring `params`). */
  @DeleteMapping(params = "purge=all")
  @PreAuthorize("hasRole('TEACHER')")
  public ResponseEntity<Void> purgeEntireRoster() {
    portalRecordService.deleteAllTeacherRoster();
    return ResponseEntity.noContent().build();
  }
}
