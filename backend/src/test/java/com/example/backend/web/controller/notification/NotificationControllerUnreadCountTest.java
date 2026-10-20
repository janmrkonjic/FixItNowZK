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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class NotificationControllerUnreadCountTest {

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
    void unreadCount_whenAuthenticatedUserHasUnreadNotifications_shouldReturn200WithCountAndVerifyUserId() throws Exception {
        when(notificationService.getUnreadCount(userId)).thenReturn(7L);

        mockMvc.perform(get("/api/notifications/unread-count"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.count").value(7));

        ArgumentCaptor<UUID> userIdCaptor = ArgumentCaptor.forClass(UUID.class);
        verify(notificationService, times(1)).getUnreadCount(userIdCaptor.capture());
        assertEquals(userId, userIdCaptor.getValue());
        verifyNoMoreInteractions(notificationService);
    }

    @Test
    void unreadCount_whenUserHasZeroUnreadNotifications_shouldReturn200WithZero() throws Exception {
        when(notificationService.getUnreadCount(userId)).thenReturn(0L);

        mockMvc.perform(get("/api/notifications/unread-count"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.count").value(0));

        verify(notificationService, times(1)).getUnreadCount(userId);
        verifyNoMoreInteractions(notificationService);
    }

    @Test
    void unreadCount_whenUnreadCountIsMaxLong_shouldReturn200WithMaxLongValue() throws Exception {
        when(notificationService.getUnreadCount(userId)).thenReturn(Long.MAX_VALUE);

        mockMvc.perform(get("/api/notifications/unread-count"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.count").value(Long.MAX_VALUE));

        verify(notificationService, times(1)).getUnreadCount(userId);
        verifyNoMoreInteractions(notificationService);
    }

    @Test
    void unreadCount_whenMultipleUsersExist_shouldQueryOnlyAuthenticatedUserId() throws Exception {
        UUID otherUserId = UUID.randomUUID();
        when(notificationService.getUnreadCount(userId)).thenReturn(3L);

        mockMvc.perform(get("/api/notifications/unread-count"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.count").value(3));

        verify(notificationService, times(1)).getUnreadCount(userId);
        verify(notificationService, never()).getUnreadCount(otherUserId);
    }

    @Test
    void unreadCount_whenPrincipalIsNull_shouldThrowExceptionAndNeverCallService() {
        SecurityContextHolder.clearContext();

        assertThrows(Exception.class, () -> mockMvc.perform(get("/api/notifications/unread-count")));
        verifyNoInteractions(notificationService);
    }

    @Test
    void unreadCount_whenPrincipalUserIsNull_shouldThrowExceptionAndNeverCallService() {
        UserPrincipal principalWithNullUser = new UserPrincipal(null);
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken(principalWithNullUser, null, List.of()));

        assertThrows(Exception.class, () -> mockMvc.perform(get("/api/notifications/unread-count")));
        verifyNoInteractions(notificationService);
    }

    @Test
    void unreadCount_whenPrincipalUserIdIsNull_shouldRejectAndNeverCallService() {
        user.setId(null);

        assertThrows(Exception.class, () -> mockMvc.perform(get("/api/notifications/unread-count"))
            .andExpect(status().is4xxClientError()));
        verifyNoInteractions(notificationService);
    }

    @Test
    void unreadCount_whenServiceThrowsRuntimeException_shouldPropagateException() {
        when(notificationService.getUnreadCount(userId))
            .thenThrow(new RuntimeException("Database connection failed"));

        assertThrows(Exception.class, () -> mockMvc.perform(get("/api/notifications/unread-count")));
        verify(notificationService, times(1)).getUnreadCount(userId);
    }
}
