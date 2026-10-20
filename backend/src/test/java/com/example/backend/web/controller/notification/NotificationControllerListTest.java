package com.example.backend.web.controller.notification;

import com.example.backend.common.exception.ResourceNotFoundException;
import com.example.backend.domain.notification.NotificationType;
import com.example.backend.domain.user.User;
import com.example.backend.domain.user.UserRole;
import com.example.backend.domain.user.UserStatus;
import com.example.backend.dto.NotificationResponse;
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

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class NotificationControllerListTest {

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
    void list_whenAuthenticatedUserHasNotifications_shouldReturn200WithAllFieldsAndVerifyUserId() throws Exception {
        UUID chatRoomId = UUID.randomUUID();
        LocalDateTime createdAt = LocalDateTime.of(2026, 10, 20, 8, 30, 0);
        NotificationResponse notification = new NotificationResponse(
            10L,
            NotificationType.NEW_MESSAGE,
            "Janez Novak",
            "2 new messages",
            "notifications.message.titleFallback",
            "notifications.message.body",
            Map.of("count", "2"),
            55L,
            chatRoomId,
            2,
            false,
            createdAt
        );
        when(notificationService.getNotifications(userId)).thenReturn(List.of(notification));

        mockMvc.perform(get("/api/notifications"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(1))
            .andExpect(jsonPath("$[0].id").value(10))
            .andExpect(jsonPath("$[0].type").value("NEW_MESSAGE"))
            .andExpect(jsonPath("$[0].title").value("Janez Novak"))
            .andExpect(jsonPath("$[0].body").value("2 new messages"))
            .andExpect(jsonPath("$[0].titleKey").value("notifications.message.titleFallback"))
            .andExpect(jsonPath("$[0].bodyKey").value("notifications.message.body"))
            .andExpect(jsonPath("$[0].params.count").value("2"))
            .andExpect(jsonPath("$[0].ticketId").value(55))
            .andExpect(jsonPath("$[0].chatRoomId").value(chatRoomId.toString()))
            .andExpect(jsonPath("$[0].aggregateCount").value(2))
            .andExpect(jsonPath("$[0].read").value(false));

        ArgumentCaptor<UUID> userIdCaptor = ArgumentCaptor.forClass(UUID.class);
        verify(notificationService, times(1)).getNotifications(userIdCaptor.capture());
        assertEquals(userId, userIdCaptor.getValue());
        verifyNoMoreInteractions(notificationService);
    }

    @Test
    void list_whenUserHasNoNotifications_shouldReturn200WithEmptyJsonArray() throws Exception {
        when(notificationService.getNotifications(userId)).thenReturn(List.of());

        mockMvc.perform(get("/api/notifications"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray())
            .andExpect(jsonPath("$").isEmpty());

        verify(notificationService, times(1)).getNotifications(userId);
        verifyNoMoreInteractions(notificationService);
    }

    @Test
    void list_whenNotificationHasNullOptionalFields_shouldReturn200WithNullFields() throws Exception {
        NotificationResponse notification = new NotificationResponse(
            1L,
            NotificationType.REVIEW_RECEIVED,
            "New review",
            "You received a 5-star review",
            null,
            null,
            null,
            null,
            null,
            1,
            true,
            LocalDateTime.of(2026, 10, 20, 9, 0, 0)
        );
        when(notificationService.getNotifications(userId)).thenReturn(List.of(notification));

        mockMvc.perform(get("/api/notifications"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(1))
            .andExpect(jsonPath("$[0].id").value(1))
            .andExpect(jsonPath("$[0].type").value("REVIEW_RECEIVED"))
            .andExpect(jsonPath("$[0].read").value(true))
            .andExpect(jsonPath("$[0].ticketId").isEmpty())
            .andExpect(jsonPath("$[0].chatRoomId").isEmpty());

        verify(notificationService, times(1)).getNotifications(userId);
    }

    @Test
    void list_whenMultipleUsersExist_shouldQueryOnlyAuthenticatedUserId() throws Exception {
        UUID otherUserId = UUID.randomUUID();
        when(notificationService.getNotifications(userId)).thenReturn(List.of());

        mockMvc.perform(get("/api/notifications"))
            .andExpect(status().isOk());

        verify(notificationService, times(1)).getNotifications(userId);
        verify(notificationService, never()).getNotifications(otherUserId);
    }

    @Test
    void list_whenPrincipalIsNull_shouldThrowExceptionAndNeverCallService() {
        SecurityContextHolder.clearContext();

        assertThrows(Exception.class, () -> mockMvc.perform(get("/api/notifications")));
        verifyNoInteractions(notificationService);
    }

    @Test
    void list_whenPrincipalUserIsNull_shouldThrowExceptionAndNeverCallService() {
        UserPrincipal principalWithNullUser = new UserPrincipal(null);
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken(principalWithNullUser, null, List.of()));

        assertThrows(Exception.class, () -> mockMvc.perform(get("/api/notifications")));
        verifyNoInteractions(notificationService);
    }

    @Test
    void list_whenPrincipalUserIdIsNull_shouldRejectAndNeverCallService() {
        user.setId(null);

        assertThrows(Exception.class, () -> mockMvc.perform(get("/api/notifications"))
            .andExpect(status().is4xxClientError()));
        verifyNoInteractions(notificationService);
    }

    @Test
    void list_whenServiceThrowsException_shouldPropagateException() {
        when(notificationService.getNotifications(userId))
            .thenThrow(new ResourceNotFoundException("User not found"));

        assertThrows(Exception.class, () -> mockMvc.perform(get("/api/notifications")));
        verify(notificationService, times(1)).getNotifications(userId);
    }
}
