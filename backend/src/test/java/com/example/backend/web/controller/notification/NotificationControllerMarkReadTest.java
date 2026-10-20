package com.example.backend.web.controller.notification;

import com.example.backend.domain.user.User;
import com.example.backend.domain.user.UserRole;
import com.example.backend.domain.user.UserStatus;
import com.example.backend.security.UserPrincipal;
import com.example.backend.service.NotificationService;
import com.example.backend.web.controller.NotificationController;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class NotificationControllerMarkReadTest {

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private NotificationController notificationController;

    private MockMvc mockMvc;
    private UUID userId;
    private User user;
    private UserPrincipal principal;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(notificationController)
            .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
            .build();

        userId = UUID.randomUUID();
        user = new User();
        user.setId(userId);
        user.setEmail("customer@test.com");
        user.setPassword("encoded");
        user.setRole(UserRole.CUSTOMER);
        user.setStatus(UserStatus.ACTIVE);
        principal = new UserPrincipal(user);

        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void markRead_whenValidIdAndAuthenticatedUser_shouldCallServiceWithExactIdAndUserIdAndReturn200() throws Exception {
        Long notificationId = 42L;
        doNothing().when(notificationService).markAsRead(notificationId, userId);

        mockMvc.perform(put("/api/notifications/{id}/read", notificationId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true));

        ArgumentCaptor<Long> idCaptor = ArgumentCaptor.forClass(Long.class);
        ArgumentCaptor<UUID> userIdCaptor = ArgumentCaptor.forClass(UUID.class);
        verify(notificationService, times(1)).markAsRead(idCaptor.capture(), userIdCaptor.capture());
        assertEquals(notificationId, idCaptor.getValue());
        assertEquals(userId, userIdCaptor.getValue());
        verifyNoMoreInteractions(notificationService);
    }

    @Test
    void markRead_whenIdIsMinimumPositiveBoundary_shouldPassExactIdAndUserId() throws Exception {
        Long minId = 1L;
        doNothing().when(notificationService).markAsRead(minId, userId);

        mockMvc.perform(put("/api/notifications/{id}/read", minId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true));

        verify(notificationService, times(1)).markAsRead(minId, userId);
        verifyNoMoreInteractions(notificationService);
    }

    @Test
    void markRead_whenIdIsMaxLongBoundary_shouldPassExactIdAndUserId() throws Exception {
        Long maxId = Long.MAX_VALUE;
        doNothing().when(notificationService).markAsRead(maxId, userId);

        mockMvc.perform(put("/api/notifications/{id}/read", maxId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true));

        verify(notificationService, times(1)).markAsRead(maxId, userId);
        verifyNoMoreInteractions(notificationService);
    }

    @Test
    void markRead_whenPathVariableIdIsNotNumeric_shouldReturn400BadRequestAndNeverCallService() throws Exception {
        mockMvc.perform(put("/api/notifications/not-a-number/read"))
            .andExpect(status().isBadRequest());

        verifyNoInteractions(notificationService);
    }

    @Test
    void markRead_whenNotificationBelongsToAnotherUser_shouldThrowAccessDeniedAndNotReturn200() {
        Long foreignNotificationId = 99L;
        doThrow(new AccessDeniedException("Not your notification"))
            .when(notificationService).markAsRead(foreignNotificationId, userId);

        assertThrows(Exception.class,
            () -> mockMvc.perform(put("/api/notifications/{id}/read", foreignNotificationId)));

        verify(notificationService, times(1)).markAsRead(foreignNotificationId, userId);
        verifyNoMoreInteractions(notificationService);
    }

    @Test
    void markRead_whenPrincipalIsNull_shouldThrowExceptionAndNeverCallService() {
        SecurityContextHolder.clearContext();

        assertThrows(Exception.class, () -> mockMvc.perform(put("/api/notifications/{id}/read", 42L)));
        verifyNoInteractions(notificationService);
    }

    @Test
    void markRead_whenPrincipalUserIsNull_shouldThrowExceptionAndNeverCallService() {
        UserPrincipal principalWithNullUser = new UserPrincipal(null);
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken(principalWithNullUser, null, List.of()));

        assertThrows(Exception.class, () -> mockMvc.perform(put("/api/notifications/{id}/read", 42L)));
        verifyNoInteractions(notificationService);
    }

    @Test
    void markRead_whenPrincipalUserIdIsNull_shouldRejectAndNeverCallService() {
        user.setId(null);

        assertThrows(Exception.class, () -> mockMvc.perform(put("/api/notifications/{id}/read", 42L))
            .andExpect(status().is4xxClientError()));
        verifyNoInteractions(notificationService);
    }
}
