package com.edupredict.portal;

import com.edupredict.user.AppRole;
import com.edupredict.user.UserAccount;
import com.edupredict.user.UserAccountRepository;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Mirrors roster rows into {@code app_users} for students (username + student_roll = roll; initial password = roll until
 * the teacher changes rolls, which rotates credentials accordingly).
 */
@Service
public class PortalStudentCredentialsService {

  private final UserAccountRepository users;
  private final PasswordEncoder passwordEncoder;

  public PortalStudentCredentialsService(UserAccountRepository users, PasswordEncoder passwordEncoder) {
    this.users = users;
    this.passwordEncoder = passwordEncoder;
  }

  @Transactional
  public void revokeStudentLoginByRoll(String rollRaw) {
    if (rollRaw == null || rollRaw.isBlank()) {
      return;
    }
    users
        .findByUsernameIgnoreCase(rollRaw.strip())
        .filter(u -> u.getRole() == AppRole.STUDENT)
        .ifPresent(users::delete);
  }

  @Transactional
  public void syncAfterRosterSave(String previousRollOrNull, String newRollNormalized) {
    String nr = newRollNormalized == null ? "" : newRollNormalized.strip();
    if (nr.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "roll invalid");
    }
    boolean hadPrior = previousRollOrNull != null && !previousRollOrNull.strip().isEmpty();
    String prev = hadPrior ? previousRollOrNull.strip() : null;

    if (hadPrior && !prev.equalsIgnoreCase(nr)) {
      revokeStudentLoginByRoll(prev);
      recreateStudentCredential(nr);
      return;
    }
    if (!hadPrior) {
      createIfMissing(nr);
      return;
    }
    createIfMissing(nr);
  }

  /** Used when wiping roster: remove student logins for each roll listed. */
  @Transactional
  public void revokeAllForRolls(java.util.Collection<String> rolls) {
    for (String r : rolls) {
      revokeStudentLoginByRoll(r);
    }
  }

  private void recreateStudentCredential(String nr) {
    revokeStudentLoginByRoll(nr);
    insertStudent(nr);
  }

  private void createIfMissing(String nr) {
    Optional<UserAccount> hit = users.findByUsernameIgnoreCase(nr);
    if (hit.isEmpty()) {
      insertStudent(nr);
    } else if (hit.get().getRole() != AppRole.STUDENT) {
      throw conflictNonStudent(nr);
    }
  }

  private void insertStudent(String nr) {
    users.save(new UserAccount(nr, passwordEncoder.encode(nr), AppRole.STUDENT, nr));
  }

  private static ResponseStatusException conflictNonStudent(String nr) {
    return new ResponseStatusException(
        HttpStatus.CONFLICT, "username already taken by a non-student login: " + nr);
  }
}
