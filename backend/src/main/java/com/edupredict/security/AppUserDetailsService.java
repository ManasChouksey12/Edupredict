package com.edupredict.security;

import com.edupredict.user.UserAccount;
import com.edupredict.user.UserAccountRepository;
import java.util.Collection;
import java.util.Collections;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class AppUserDetailsService implements UserDetailsService {

  private final UserAccountRepository users;

  public AppUserDetailsService(UserAccountRepository users) {
    this.users = users;
  }

  @Override
  public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
    String trimmed = username == null ? "" : username.strip();
    UserAccount u =
        users
            .findByUsername(trimmed)
            .or(() -> users.findByUsernameIgnoreCase(trimmed))
            .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    GrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + u.getRole().name());
    Collection<GrantedAuthority> authorities = Collections.singletonList(authority);
    return User.builder()
        .username(u.getUsername())
        .password(u.getPasswordHash())
        .authorities(authorities)
        .build();
  }
}
