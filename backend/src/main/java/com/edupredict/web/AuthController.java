package com.edupredict.web;

import com.edupredict.dto.LoginRequest;
import com.edupredict.dto.LoginResponse;
import com.edupredict.dto.MeResponse;
import com.edupredict.security.AuthPrincipal;
import com.edupredict.security.JwtService;
import com.edupredict.user.UserAccountRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

  private final AuthenticationManager authenticationManager;
  private final UserAccountRepository userAccountRepository;
  private final JwtService jwtService;

  public AuthController(
      AuthenticationManager authenticationManager,
      UserAccountRepository userAccountRepository,
      JwtService jwtService) {
    this.authenticationManager = authenticationManager;
    this.userAccountRepository = userAccountRepository;
    this.jwtService = jwtService;
  }

  @PostMapping("/login")
  public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
    try {
      Authentication authentication =
          authenticationManager.authenticate(
              new UsernamePasswordAuthenticationToken(request.username(), request.password()));
      var ua =
          userAccountRepository
              .findByUsername(authentication.getName())
              .orElseThrow(() -> new IllegalStateException("user missing"));
      String roll = ua.getStudentRoll() == null ? "" : ua.getStudentRoll().strip();
      String token = jwtService.generateToken(ua);
      return ResponseEntity.ok(new LoginResponse(token, ua.getRole().name(), roll));
    } catch (AuthenticationException | IllegalArgumentException | IllegalStateException e) {
      return ResponseEntity.status(401).build();
    }
  }

  @GetMapping("/me")
  public ResponseEntity<MeResponse> me(@AuthenticationPrincipal AuthPrincipal principal) {
    if (principal == null) {
      return ResponseEntity.status(401).build();
    }
    String roll =
        principal.studentRoll() == null ? "" : principal.studentRoll().strip();
    return ResponseEntity.ok(new MeResponse(principal.username(), principal.role(), roll));
  }
}
