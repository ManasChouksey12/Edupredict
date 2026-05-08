package com.edupredict.security;

import com.edupredict.user.UserAccountRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Date;
import java.util.List;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

  private final JwtService jwtService;
  private final UserAccountRepository userAccountRepository;

  public JwtAuthenticationFilter(JwtService jwtService, UserAccountRepository userAccountRepository) {
    this.jwtService = jwtService;
    this.userAccountRepository = userAccountRepository;
  }

  @Override
  protected void doFilterInternal(
      @NonNull HttpServletRequest request,
      @NonNull HttpServletResponse response,
      @NonNull FilterChain filterChain)
      throws ServletException, IOException {

    final String authHeader = request.getHeader("Authorization");
    if (authHeader == null || !authHeader.startsWith("Bearer ")) {
      filterChain.doFilter(request, response);
      return;
    }

    try {
      String jwt = authHeader.substring(7);
      var claims = jwtService.parseClaims(jwt);
      String username = claims.getSubject();
      String roleClaim = claims.get("role", String.class);
      String rollClaim = claims.get("studentRoll", String.class);
      if (rollClaim == null) {
        rollClaim = "";
      }

      if (username != null
          && roleClaim != null
          && claims.getExpiration().after(new Date())
          && SecurityContextHolder.getContext().getAuthentication() == null
          && userAccountRepository.findByUsername(username).isPresent()) {

        SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + roleClaim);
        AuthPrincipal principal = new AuthPrincipal(username, rollClaim, roleClaim);
        UsernamePasswordAuthenticationToken auth =
            new UsernamePasswordAuthenticationToken(principal, null, List.of(authority));
        auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(auth);
      }
    } catch (RuntimeException ignored) {
      SecurityContextHolder.clearContext();
    }

    filterChain.doFilter(request, response);
  }
}
