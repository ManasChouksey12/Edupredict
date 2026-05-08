package com.edupredict.portal;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StoredPortalRecordRepository extends JpaRepository<StoredPortalRecord, String> {

  Optional<StoredPortalRecord> findByRollNumberIgnoreCase(String rollNumber);
}
