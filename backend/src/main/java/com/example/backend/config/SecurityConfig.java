package com.example.backend.config;

import com.example.backend.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.ArrayList;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final AuthenticationProvider authenticationProvider;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    private static final String[] PUBLIC_ENDPOINTS = {
        "/api/v1/auth/register",
        "/api/v1/auth/register/provider",
        "/api/v1/auth/login",
        "/api/v1/auth/google",
        "/api/v1/auth/confirm-email",
        "/api/v1/auth/resend-confirmation",
        "/api/v1/auth/forgot-password",
        "/api/v1/auth/reset-password",
        "/api/v1/auth/refresh",
        "/api/v1/auth/logout",
        "/api/v1/auth/2fa/verify",
        "/api/v1/providers/search",
        "/api/v1/providers/categories",
        "/api/v1/providers/classify",
        "/api/v1/public/stats",
        "/api/v1/public/stats/**",
        "/api/v1/geocode/search",
        "/api/tickets/public/open",
        // Stripe webhook — authenticated by signature verification, not JWT.
        "/api/payments/webhook",
        "/actuator/health",
        "/swagger-ui/**",
        "/swagger-ui.html",
        "/v3/api-docs/**",
        "/ws/**"
    };

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/providers/*/calendar").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/providers/*/reviews").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/providers/*/reviews/stats").permitAll()
                // "/providers/me" is the *current* provider's own profile and must stay
                // authenticated. It has to come before the public "/providers/*" wildcard
                // below, otherwise that wildcard matches "me" too and lets unauthenticated
                // requests reach the controller with a null principal (NPE).
                .requestMatchers(HttpMethod.GET, "/api/v1/providers/me").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/v1/providers/*").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/providers/classify").permitAll()
                .requestMatchers(PUBLIC_ENDPOINTS).permitAll()
                .anyRequest().authenticated()
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .authenticationProvider(authenticationProvider)
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        List<String> originPatterns = new ArrayList<>(List.of(
            "http://localhost:*",
            "http://127.0.0.1:*",
            "http://localhost:5173",
            "http://localhost:3000"
        ));
        if (frontendUrl != null && !frontendUrl.isBlank()) {
            for (String origin : frontendUrl.split(",")) {
                String trimmed = origin.trim();
                if (!trimmed.isEmpty() && !originPatterns.contains(trimmed)) {
                    originPatterns.add(trimmed);
                }
            }
        }
        config.setAllowedOriginPatterns(originPatterns);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of("Authorization"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
