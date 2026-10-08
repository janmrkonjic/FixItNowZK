package com.example.backend.config;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.ArrayList;
import java.util.List;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final WebSocketAuthChannelInterceptor webSocketAuthChannelInterceptor;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // "/topic" = broadcast (rooms); "/queue" = per-user point-to-point, used to
        // deliver rate-limit / anti-spam errors to the offending sender only.
        registry.enableSimpleBroker("/topic", "/queue");
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
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
        registry.addEndpoint("/ws")
            .setAllowedOriginPatterns(originPatterns.toArray(String[]::new))
            .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        // Message rate limiting is enforced in ChatWebSocketController (so it can
        // report a graceful error without tearing down the connection), not here.
        registration.interceptors(webSocketAuthChannelInterceptor);
    }
}
