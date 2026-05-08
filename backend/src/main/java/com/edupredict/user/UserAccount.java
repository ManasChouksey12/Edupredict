package com.edupredict.user;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "app_users")
public class UserAccount {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true)
  private String username;

  @Column(nullable = false)
  private String passwordHash;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private AppRole role;

  /** Matches {@code StudentRecord.rollNumber} for STUDENT login. */
  @Column(length = 64)
  private String studentRoll;

  protected UserAccount() {}

  public UserAccount(String username, String passwordHash, AppRole role, String studentRoll) {
    this.username = username;
    this.passwordHash = passwordHash;
    this.role = role;
    this.studentRoll = studentRoll;
  }

  public Long getId() {
    return id;
  }

  public String getUsername() {
    return username;
  }

  public String getPasswordHash() {
    return passwordHash;
  }

  public AppRole getRole() {
    return role;
  }

  public String getStudentRoll() {
    return studentRoll;
  }
}
