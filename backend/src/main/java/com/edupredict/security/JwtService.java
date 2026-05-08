package com.edupredict.security;

import com.edupredict.user.UserAccount;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

  private final SecretKey signingKey;
  private final long expirationMs;

  public JwtService(
      @Value("${jwt.secret}") String secret,
      @Value("${jwt.expiration-ms}") long expirationMs) {
    byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
    if (keyBytes.length < 32) {
      byte[] padded = new byte[32];
      System.arraycopy(keyBytes, 0, padded, 0, Math.min(keyBytes.length, 32));
      this.signingKey = Keys.hmacShaKeyFor(padded);
    } else {
      this.signingKey = Keys.hmacShaKeyFor(keyBytes);
    }
    this.expirationMs = expirationMs;
  }

  public String generateToken(UserAccount account) {
    Date now = new Date();
    Date exp = new Date(now.getTime() + expirationMs);
    String studentRoll = account.getStudentRoll() == null ? "" : account.getStudentRoll();
    return Jwts.builder()
        .subject(account.getUsername())
        .issuedAt(now)
        .expiration(exp)
        .claim("role", account.getRole().name())
        .claim("studentRoll", studentRoll)
        .signWith(signingKey)
        .compact();
  }

  public Claims parseClaims(String token) {
    return Jwts.parser().verifyWith(signingKey).build().parseSignedClaims(token).getPayload();
  }
}
