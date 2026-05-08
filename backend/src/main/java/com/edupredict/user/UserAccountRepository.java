package com.edupredict.user;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {
  Optional<UserAccount> findByUsername(String username);

  Optional<UserAccount> findByUsernameIgnoreCase(String username);
}
