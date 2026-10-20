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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class NotificationControllerDeleteAllTest {

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
    void deleteAll_whenAuthenticatedUser_shouldCallServiceOnceWithExactUserIdAndReturn200() throws Exception {
        doNothing().when(notificationService).deleteAll(userId);

        mockMvc.perform(delete("/api/notifications"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true));

        ArgumentCaptor<UUID> userIdCaptor = ArgumentCaptor.forClass(UUID.class);
        verify(notificationService, times(1)).deleteAll(userIdCaptor.capture());
        assertEquals(userId, userIdCaptor.getValue());
        verifyNoMoreInteractions(notificationService);
    }

    @Test
    void deleteAll_whenMultipleUsersExist_shouldDeleteOnlyForAuthenticatedUserId() throws Exception {
        UUID otherUserId = UUID.randomUUID();
        doNothing().when(notificationService).deleteAll(userId);

        mockMvc.perform(delete("/api/notifications"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true));

        verify(notificationService, times(1)).deleteAll(userId);
        verify(notificationService, never()).deleteAll(otherUserId);
    }

    @Test
    void deleteAll_whenPrincipalIsNull_shouldThrowExceptionAndNeverCallService() {
        SecurityContextHolder.clearContext();

        assertThrows(Exception.class, () -> mockMvc.perform(delete("/api/notifications")));
        verifyNoInteractions(notificationService);
    }

    @Test
    void deleteAll_whenPrincipalUserIsNull_shouldThrowExceptionAndNeverCallService() {
        UserPrincipal principalWithNullUser = new UserPrincipal(null);
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken(principalWithNullUser, null, List.of()));

        assertThrows(Exception.class, () -> mockMvc.perform(delete("/api/notifications")));
        verifyNoInteractions(notificationService);
    }

    @Test
    void deleteAll_whenPrincipalUserIdIsNull_shouldRejectAndNeverCallService() {
        user.setId(null);

        assertThrows(Exception.class, () -> mockMvc.perform(delete("/api/notifications"))
            .andExpect(status().is4xxClientError()));
        verifyNoInteractions(notificationService);
    }

    @Test
    void deleteAll_whenServiceThrowsRuntimeException_shouldPropagateException() {
        doThrow(new RuntimeException("Failed to delete notifications"))
            .when(notificationService).deleteAll(userId);

        assertThrows(Exception.class, () -> mockMvc.perform(delete("/api/notifications")));
        verify(notificationService, times(1)).deleteAll(userId);
    }
}
