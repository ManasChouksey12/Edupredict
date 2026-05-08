package com.edupredict.portal;

import jakarta.persistence.Basic;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;

@Entity
@Table(name = "portal_student_records")
public class StoredPortalRecord {

  @Id
  private String id;

  @Column(nullable = false, unique = true, length = 64)
  private String rollNumber;

  @Lob
  @Basic(fetch = FetchType.EAGER)
  @Column(nullable = false, length = 1_048_575)
  private String payloadJson;

  protected StoredPortalRecord() {}

  public StoredPortalRecord(String id, String rollNumber, String payloadJson) {
    this.id = id;
    this.rollNumber = rollNumber;
    this.payloadJson = payloadJson;
  }

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getRollNumber() {
    return rollNumber;
  }

  public void setRollNumber(String rollNumber) {
    this.rollNumber = rollNumber;
  }

  public String getPayloadJson() {
    return payloadJson;
  }

  public void setPayloadJson(String payloadJson) {
    this.payloadJson = payloadJson;
  }
}
