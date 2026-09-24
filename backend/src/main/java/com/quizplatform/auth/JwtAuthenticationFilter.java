package com.quizplatform.auth;

import com.quizplatform.common.UnauthorizedException;
import com.quizplatform.user.UserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    public JwtAuthenticationFilter(JwtService jwtService, UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ") && header.length() > 7) {
            try {
                Claims claims = jwtService.parseAccessToken(header.substring(7));
                UserPrincipal principal = userRepository.findById(jwtService.userId(claims))
                        .map(UserPrincipal::new)
                        .orElseThrow(() -> new UnauthorizedException("INVALID_TOKEN", "Authentication token is invalid"));
                Object passwordChanged = claims.get("pwd");
                if (passwordChanged instanceof Number number
                        && principal.getPasswordChangedAt() != null
                        && principal.getPasswordChangedAt().getEpochSecond() > number.longValue()) {
                    throw new UnauthorizedException("TOKEN_REVOKED", "Authentication token is no longer valid");
                }
                if (principal.isBanned()) {
                    throw new UnauthorizedException("ACCOUNT_BANNED", "This account is currently suspended");
                }
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        principal, null, principal.getAuthorities());
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } catch (JwtException | IllegalArgumentException | UnauthorizedException ignored) {
                SecurityContextHolder.clearContext();
            }
        }
        filterChain.doFilter(request, response);
    }
}
