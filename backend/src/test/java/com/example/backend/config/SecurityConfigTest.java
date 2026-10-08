package com.example.backend.config;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

import static org.junit.jupiter.api.Assertions.*;

class SecurityConfigTest {

    private SecurityConfig securityConfig;

    @BeforeEach
    void setUp() {
        securityConfig = new SecurityConfig(null, null);
        ReflectionTestUtils.setField(securityConfig, "frontendUrl", "http://localhost:5173");
    }

    @Test
    @DisplayName("CORS allows requests from localhost:5173 (Vite default)")
    void corsAllowsViteDefaultPort() {
        CorsConfigurationSource source = securityConfig.corsConfigurationSource();
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/v1/providers/categories");

        CorsConfiguration config = source.getCorsConfiguration(request);
        assertNotNull(config);
        assertEquals("http://localhost:5173", config.checkOrigin("http://localhost:5173"));
    }

    @Test
    @DisplayName("CORS allows requests from localhost:3000")
    void corsAllowsPort3000() {
        CorsConfigurationSource source = securityConfig.corsConfigurationSource();
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/v1/providers/categories");

        CorsConfiguration config = source.getCorsConfiguration(request);
        assertNotNull(config);
        assertEquals("http://localhost:3000", config.checkOrigin("http://localhost:3000"));
    }

    @Test
    @DisplayName("CORS allows any localhost port (e.g. 5174 if 5173 is occupied)")
    void corsAllowsAnyLocalhostPort() {
        CorsConfigurationSource source = securityConfig.corsConfigurationSource();
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/v1/providers/search");

        CorsConfiguration config = source.getCorsConfiguration(request);
        assertNotNull(config);
        assertEquals("http://localhost:5174", config.checkOrigin("http://localhost:5174"));
    }

    @Test
    @DisplayName("CORS rejects untrusted external origins")
    void corsRejectsUntrustedOrigin() {
        CorsConfigurationSource source = securityConfig.corsConfigurationSource();
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/v1/providers/categories");

        CorsConfiguration config = source.getCorsConfiguration(request);
        assertNotNull(config);
        assertNull(config.checkOrigin("http://malicious-site.com"));
    }

    @Test
    @DisplayName("CORS allows credentials and all headers")
    void corsAllowsCredentialsAndHeaders() {
        CorsConfigurationSource source = securityConfig.corsConfigurationSource();
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/v1/providers/categories");

        CorsConfiguration config = source.getCorsConfiguration(request);
        assertNotNull(config);
        assertTrue(config.getAllowCredentials());
        assertTrue(config.getAllowedHeaders().contains("*"));
    }
}
