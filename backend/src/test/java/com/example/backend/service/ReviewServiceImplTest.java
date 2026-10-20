package com.example.backend.service;

import com.example.backend.common.exception.ApiException;
import com.example.backend.common.exception.ResourceNotFoundException;
import com.example.backend.domain.review.Review;
import com.example.backend.domain.ticket.TicketStatus;
import com.example.backend.domain.user.Provider;
import com.example.backend.domain.user.User;
import com.example.backend.domain.user.UserRole;
import com.example.backend.domain.user.UserStatus;
import com.example.backend.repository.ProviderRepository;
import com.example.backend.repository.ReviewRepository;
import com.example.backend.repository.TicketRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.web.dto.request.CreateReviewRequest;
import com.example.backend.web.dto.response.ProviderRatingStats;
import com.example.backend.web.dto.response.ReviewResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReviewServiceImplTest {

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private ProviderRepository providerRepository;

    @Mock
    private TicketRepository ticketRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private ReviewServiceImpl reviewService;

    // ── Pomožne metode za pripravo testnih entitet ───────────────────────────

    private Provider createProvider(UUID id) {
        Provider p = new Provider();
        p.setId(id);
        p.setEmail("provider@test.com");
        p.setFirstName("Ana");
        p.setLastName("Kovač");
        p.setPassword("encoded");
        p.setRole(UserRole.PROVIDER);
        p.setStatus(UserStatus.ACTIVE);
        p.setDeleted(false);
        return p;
    }

    private User createReviewer(UUID id) {
        User u = new User();
        u.setId(id);
        u.setEmail("reviewer@test.com");
        u.setFirstName("Janez");
        u.setLastName("Novak");
        u.setPassword("encoded");
        u.setRole(UserRole.CUSTOMER);
        u.setStatus(UserStatus.ACTIVE);
        u.setProfilePictureUrl("https://cdn.example.com/janez.png");
        u.setDeleted(false);
        return u;
    }

    private CreateReviewRequest createRequest(int rating, String comment) {
        CreateReviewRequest r = new CreateReviewRequest();
        r.setRating(rating);
        r.setComment(comment);
        return r;
    }

    // ── 1. Običajni primeri (Happy Path) ─────────────────────────────────────

    @Test
    void upsertReview_koStrankaOddaNovoOcenoPoZakljucenemZahtevku_najShraniOcenoPosljeObvestiloInVrneOdgovor() {
        UUID reviewerId = UUID.fromString("11111111-1111-1111-1111-111111111111");
        UUID providerId = UUID.fromString("22222222-2222-2222-2222-222222222222");
        UUID savedReviewId = UUID.fromString("33333333-3333-3333-3333-333333333333");
        LocalDateTime createdAt = LocalDateTime.of(2026, 10, 20, 10, 0);

        User reviewer = createReviewer(reviewerId);
        Provider provider = createProvider(providerId);
        CreateReviewRequest request = createRequest(4, "Zelo strokovno opravljeno delo.");

        when(providerRepository.findById(providerId)).thenReturn(Optional.of(provider));
        when(ticketRepository.existsByUser_IdAndAssignedServiceProvider_IdAndStatus(
            reviewerId, providerId, TicketStatus.COMPLETED)).thenReturn(true);
        when(reviewRepository.findByReviewerIdAndProviderId(reviewerId, providerId))
            .thenReturn(Optional.empty());
        when(userRepository.findById(reviewerId)).thenReturn(Optional.of(reviewer));

        when(reviewRepository.save(any(Review.class))).thenAnswer(invocation -> {
            Review toSave = invocation.getArgument(0);
            return Review.builder()
                .id(savedReviewId)
                .reviewer(toSave.getReviewer())
                .provider(toSave.getProvider())
                .rating(toSave.getRating())
                .comment(toSave.getComment())
                .createdAt(createdAt)
                .updatedAt(createdAt)
                .build();
        });

        ReviewResponse actual = reviewService.upsertReview(reviewerId, providerId, request);

        ArgumentCaptor<Review> reviewCaptor = ArgumentCaptor.forClass(Review.class);
        verify(reviewRepository).save(reviewCaptor.capture());
        Review capturedReview = reviewCaptor.getValue();
        assertSame(reviewer, capturedReview.getReviewer());
        assertSame(provider, capturedReview.getProvider());
        assertEquals(4, capturedReview.getRating());
        assertEquals("Zelo strokovno opravljeno delo.", capturedReview.getComment());

        verify(notificationService).notifyReviewReceived(
            eq(providerId),
            eq("New review"),
            eq("Janez Novak left you a 4★ review."),
            eq("notifications.review.title"),
            eq("notifications.review.body"),
            eq(Map.of("reviewerName", "Janez Novak", "rating", "4"))
        );

        assertNotNull(actual);
        assertEquals(savedReviewId, actual.getId());
        assertEquals(providerId, actual.getProviderId());
        assertEquals(reviewerId, actual.getReviewerId());
        assertEquals("Janez Novak", actual.getReviewerName());
        assertEquals("https://cdn.example.com/janez.png", actual.getReviewerProfilePictureUrl());
        assertEquals(4, actual.getRating());
        assertEquals("Zelo strokovno opravljeno delo.", actual.getComment());
        assertEquals(createdAt, actual.getCreatedAt());
        assertEquals(createdAt, actual.getUpdatedAt());
    }

    @Test
    void upsertReview_koStrankaPosodobiObstojecoOceno_najPosodobiOcenoInKomentarBrezNovegaObvestila() {
        UUID reviewerId = UUID.fromString("11111111-1111-1111-1111-111111111111");
        UUID providerId = UUID.fromString("22222222-2222-2222-2222-222222222222");
        UUID existingReviewId = UUID.fromString("44444444-4444-4444-4444-444444444444");

        User reviewer = createReviewer(reviewerId);
        Provider provider = createProvider(providerId);
        Review existingReview = Review.builder()
            .id(existingReviewId)
            .reviewer(reviewer)
            .provider(provider)
            .rating(2)
            .comment("Prvotni komentar")
            .build();

        CreateReviewRequest updateRequest = createRequest(5, "Popravljen komentar po dogovoru");

        when(providerRepository.findById(providerId)).thenReturn(Optional.of(provider));
        when(ticketRepository.existsByUser_IdAndAssignedServiceProvider_IdAndStatus(
            reviewerId, providerId, TicketStatus.COMPLETED)).thenReturn(true);
        when(reviewRepository.findByReviewerIdAndProviderId(reviewerId, providerId))
            .thenReturn(Optional.of(existingReview));
        when(reviewRepository.save(existingReview)).thenReturn(existingReview);

        ReviewResponse actual = reviewService.upsertReview(reviewerId, providerId, updateRequest);

        assertEquals(5, existingReview.getRating());
        assertEquals("Popravljen komentar po dogovoru", existingReview.getComment());
        verify(reviewRepository).save(existingReview);
        verifyNoInteractions(userRepository);
        verifyNoInteractions(notificationService);

        assertNotNull(actual);
        assertEquals(existingReviewId, actual.getId());
        assertEquals(5, actual.getRating());
        assertEquals("Popravljen komentar po dogovoru", actual.getComment());
    }

    @Test
    void listForProvider_koPonudnikImaVecOcen_najVrnePreslikanSeznamOcen() {
        UUID providerId = UUID.fromString("22222222-2222-2222-2222-222222222222");
        Provider provider = createProvider(providerId);
        User reviewer1 = createReviewer(UUID.fromString("11111111-1111-1111-1111-111111111111"));
        User reviewer2 = createReviewer(UUID.fromString("55555555-5555-5555-5555-555555555555"));
        reviewer2.setFirstName("Maja");
        reviewer2.setLastName("Horvat");

        Review r1 = Review.builder()
            .id(UUID.fromString("aaaa1111-1111-1111-1111-111111111111"))
            .reviewer(reviewer1)
            .provider(provider)
            .rating(5)
            .comment("Odlično")
            .build();
        Review r2 = Review.builder()
            .id(UUID.fromString("bbbb2222-2222-2222-2222-222222222222"))
            .reviewer(reviewer2)
            .provider(provider)
            .rating(3)
            .comment("Solidno")
            .build();

        when(reviewRepository.findAllByProviderIdOrderByCreatedAtDesc(providerId))
            .thenReturn(List.of(r1, r2));

        List<ReviewResponse> actual = reviewService.listForProvider(providerId);

        assertEquals(2, actual.size());
        assertEquals(r1.getId(), actual.get(0).getId());
        assertEquals("Janez Novak", actual.get(0).getReviewerName());
        assertEquals(5, actual.get(0).getRating());
        assertEquals("Odlično", actual.get(0).getComment());

        assertEquals(r2.getId(), actual.get(1).getId());
        assertEquals("Maja Horvat", actual.get(1).getReviewerName());
        assertEquals(3, actual.get(1).getRating());
        assertEquals("Solidno", actual.get(1).getComment());
    }

    @Test
    void getStats_koPonudnikImaOcene_najVrneSteviloInPovprecnoOceno() {
        UUID providerId = UUID.fromString("22222222-2222-2222-2222-222222222222");
        when(reviewRepository.countByProviderId(providerId)).thenReturn(4L);
        when(reviewRepository.averageRatingByProviderId(providerId)).thenReturn(4.25);

        ProviderRatingStats actual = reviewService.getStats(providerId);

        assertNotNull(actual);
        assertEquals(providerId, actual.getProviderId());
        assertEquals(4L, actual.getReviewCount());
        assertEquals(4.25, actual.getAverageRating());
        verify(reviewRepository).countByProviderId(providerId);
        verify(reviewRepository).averageRatingByProviderId(providerId);
    }

    @Test
    void deleteOwnReview_koOcenaObstaja_najPokliceBrisanjeVRepozitoriju() {
        UUID reviewerId = UUID.fromString("11111111-1111-1111-1111-111111111111");
        UUID providerId = UUID.fromString("22222222-2222-2222-2222-222222222222");
        Review existingReview = Review.builder()
            .id(UUID.fromString("33333333-3333-3333-3333-333333333333"))
            .rating(4)
            .build();

        when(reviewRepository.findByReviewerIdAndProviderId(reviewerId, providerId))
            .thenReturn(Optional.of(existingReview));

        reviewService.deleteOwnReview(reviewerId, providerId);

        verify(reviewRepository).findByReviewerIdAndProviderId(reviewerId, providerId);
        verify(reviewRepository).delete(existingReview);
        verifyNoMoreInteractions(reviewRepository);
    }

    // ── 2. Robne vrednosti (Boundary Cases) ──────────────────────────────────

    @ParameterizedTest
    @ValueSource(ints = {1, 5})
    void upsertReview_koJeOcenaNaSpodnjiAliZgornjiMeji_najUspesnoShraniOceno(int boundaryRating) {
        UUID reviewerId = UUID.fromString("11111111-1111-1111-1111-111111111111");
        UUID providerId = UUID.fromString("22222222-2222-2222-2222-222222222222");
        User reviewer = createReviewer(reviewerId);
        Provider provider = createProvider(providerId);
        CreateReviewRequest request = createRequest(boundaryRating, "Mejna ocena");

        when(providerRepository.findById(providerId)).thenReturn(Optional.of(provider));
        when(ticketRepository.existsByUser_IdAndAssignedServiceProvider_IdAndStatus(
            reviewerId, providerId, TicketStatus.COMPLETED)).thenReturn(true);
        when(reviewRepository.findByReviewerIdAndProviderId(reviewerId, providerId))
            .thenReturn(Optional.empty());
        when(userRepository.findById(reviewerId)).thenReturn(Optional.of(reviewer));
        when(reviewRepository.save(any(Review.class))).thenAnswer(inv -> inv.getArgument(0));

        ReviewResponse actual = reviewService.upsertReview(reviewerId, providerId, request);

        assertEquals(boundaryRating, actual.getRating());
        verify(notificationService).notifyReviewReceived(
            eq(providerId),
            eq("New review"),
            eq("Janez Novak left you a " + boundaryRating + "★ review."),
            eq("notifications.review.title"),
            eq("notifications.review.body"),
            eq(Map.of("reviewerName", "Janez Novak", "rating", String.valueOf(boundaryRating)))
        );
    }

    @ParameterizedTest
    @NullAndEmptySource
    void upsertReview_koJeKomentarNullAliPrazen_najUspesnoShraniOceno(String emptyOrNullComment) {
        UUID reviewerId = UUID.fromString("11111111-1111-1111-1111-111111111111");
        UUID providerId = UUID.fromString("22222222-2222-2222-2222-222222222222");
        User reviewer = createReviewer(reviewerId);
        Provider provider = createProvider(providerId);
        CreateReviewRequest request = createRequest(5, emptyOrNullComment);

        when(providerRepository.findById(providerId)).thenReturn(Optional.of(provider));
        when(ticketRepository.existsByUser_IdAndAssignedServiceProvider_IdAndStatus(
            reviewerId, providerId, TicketStatus.COMPLETED)).thenReturn(true);
        when(reviewRepository.findByReviewerIdAndProviderId(reviewerId, providerId))
            .thenReturn(Optional.empty());
        when(userRepository.findById(reviewerId)).thenReturn(Optional.of(reviewer));
        when(reviewRepository.save(any(Review.class))).thenAnswer(inv -> inv.getArgument(0));

        ReviewResponse actual = reviewService.upsertReview(reviewerId, providerId, request);

        assertEquals(5, actual.getRating());
        assertEquals(emptyOrNullComment, actual.getComment());
    }

    @Test
    void upsertReview_koJeOcenjevalecMehkoIzbrisan_najVOdgovoruMaskiraImeInSkrijeProfilnoSliko() {
        UUID reviewerId = UUID.fromString("11111111-1111-1111-1111-111111111111");
        UUID providerId = UUID.fromString("22222222-2222-2222-2222-222222222222");
        User deletedReviewer = createReviewer(reviewerId);
        deletedReviewer.setDeleted(true);
        Provider provider = createProvider(providerId);

        when(providerRepository.findById(providerId)).thenReturn(Optional.of(provider));
        when(ticketRepository.existsByUser_IdAndAssignedServiceProvider_IdAndStatus(
            reviewerId, providerId, TicketStatus.COMPLETED)).thenReturn(true);
        when(reviewRepository.findByReviewerIdAndProviderId(reviewerId, providerId))
            .thenReturn(Optional.empty());
        when(userRepository.findById(reviewerId)).thenReturn(Optional.of(deletedReviewer));
        when(reviewRepository.save(any(Review.class))).thenAnswer(inv -> inv.getArgument(0));

        ReviewResponse actual = reviewService.upsertReview(reviewerId, providerId, createRequest(5, "Super"));

        assertEquals("Former Customer", actual.getReviewerName());
        assertNull(actual.getReviewerProfilePictureUrl());
    }

    @Test
    void upsertReview_koOcenjevalecNimaImenaInPriimka_najUporabiEmailKotPrikaznoIme() {
        UUID reviewerId = UUID.fromString("11111111-1111-1111-1111-111111111111");
        UUID providerId = UUID.fromString("22222222-2222-2222-2222-222222222222");
        User namelessReviewer = createReviewer(reviewerId);
        namelessReviewer.setFirstName("   ");
        namelessReviewer.setLastName("");
        Provider provider = createProvider(providerId);

        when(providerRepository.findById(providerId)).thenReturn(Optional.of(provider));
        when(ticketRepository.existsByUser_IdAndAssignedServiceProvider_IdAndStatus(
            reviewerId, providerId, TicketStatus.COMPLETED)).thenReturn(true);
        when(reviewRepository.findByReviewerIdAndProviderId(reviewerId, providerId))
            .thenReturn(Optional.empty());
        when(userRepository.findById(reviewerId)).thenReturn(Optional.of(namelessReviewer));
        when(reviewRepository.save(any(Review.class))).thenAnswer(inv -> inv.getArgument(0));

        ReviewResponse actual = reviewService.upsertReview(reviewerId, providerId, createRequest(5, "Super"));

        assertEquals("reviewer@test.com", actual.getReviewerName());
        verify(notificationService).notifyReviewReceived(
            eq(providerId),
            eq("New review"),
            eq("reviewer@test.com left you a 5★ review."),
            eq("notifications.review.title"),
            eq("notifications.review.body"),
            eq(Map.of("reviewerName", "reviewer@test.com", "rating", "5"))
        );
    }

    @Test
    void listForProvider_koPonudnikNimaOcen_najVrnePrazenSeznam() {
        UUID providerId = UUID.fromString("22222222-2222-2222-2222-222222222222");
        when(reviewRepository.findAllByProviderIdOrderByCreatedAtDesc(providerId))
            .thenReturn(Collections.emptyList());

        List<ReviewResponse> actual = reviewService.listForProvider(providerId);

        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void getStats_koPonudnikNimaOcen_najVrneNicInNullPovprecjeBrezKlicaIzracunaPovprecja() {
        UUID providerId = UUID.fromString("22222222-2222-2222-2222-222222222222");
        when(reviewRepository.countByProviderId(providerId)).thenReturn(0L);

        ProviderRatingStats actual = reviewService.getStats(providerId);

        assertEquals(providerId, actual.getProviderId());
        assertEquals(0L, actual.getReviewCount());
        assertNull(actual.getAverageRating());
        verify(reviewRepository).countByProviderId(providerId);
        verify(reviewRepository, never()).averageRatingByProviderId(any());
    }

    @Test
    void deleteOwnReview_koOcenaNeObstaja_najNeSproziIzjemeInNeKliceBrisanja() {
        UUID reviewerId = UUID.fromString("11111111-1111-1111-1111-111111111111");
        UUID providerId = UUID.fromString("22222222-2222-2222-2222-222222222222");
        when(reviewRepository.findByReviewerIdAndProviderId(reviewerId, providerId))
            .thenReturn(Optional.empty());

        assertDoesNotThrow(() -> reviewService.deleteOwnReview(reviewerId, providerId));
        verify(reviewRepository, never()).delete(any());
    }

    // ── 3. Neveljavni vhodi in izjeme (Invalid Inputs & Exceptions) ──────────

    @Test
    void upsertReview_koOcenjevalecOceniSamegaSebe_najSproziApiExceptionInNeKliceRepozitorijev() {
        UUID sameId = UUID.fromString("11111111-1111-1111-1111-111111111111");
        CreateReviewRequest request = createRequest(5, "Samohvala");

        ApiException ex = assertThrows(ApiException.class,
            () -> reviewService.upsertReview(sameId, sameId, request));

        assertEquals("You cannot review yourself.", ex.getMessage());
        verifyNoInteractions(providerRepository, ticketRepository, reviewRepository, userRepository, notificationService);
    }

    @ParameterizedTest
    @ValueSource(ints = {Integer.MIN_VALUE, -5, -1, 0, 6, 10, Integer.MAX_VALUE})
    void upsertReview_koJeOcenaIzvenDovoljenegaObsega_najSproziApiExceptionInNeKliceRepozitorijev(int invalidRating) {
        UUID reviewerId = UUID.fromString("11111111-1111-1111-1111-111111111111");
        UUID providerId = UUID.fromString("22222222-2222-2222-2222-222222222222");
        CreateReviewRequest request = createRequest(invalidRating, "Neveljavna ocena");

        ApiException ex = assertThrows(ApiException.class,
            () -> reviewService.upsertReview(reviewerId, providerId, request));

        assertEquals("Rating must be between 1 and 5.", ex.getMessage());
        verifyNoInteractions(providerRepository, ticketRepository, reviewRepository, userRepository, notificationService);
    }

    @Test
    void upsertReview_koPonudnikNeObstaja_najSproziResourceNotFoundExceptionInNePreverjaZahtevkov() {
        UUID reviewerId = UUID.fromString("11111111-1111-1111-1111-111111111111");
        UUID providerId = UUID.fromString("22222222-2222-2222-2222-222222222222");
        when(providerRepository.findById(providerId)).thenReturn(Optional.empty());

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class,
            () -> reviewService.upsertReview(reviewerId, providerId, createRequest(5, "Komentar")));

        assertEquals("Provider not found.", ex.getMessage());
        verifyNoInteractions(ticketRepository, reviewRepository, userRepository, notificationService);
    }

    @Test
    void upsertReview_koStrankaNimaZakljucenegaZahtevkaPriPonudniku_najSproziApiExceptionInNeShraniOcene() {
        UUID reviewerId = UUID.fromString("11111111-1111-1111-1111-111111111111");
        UUID providerId = UUID.fromString("22222222-2222-2222-2222-222222222222");
        Provider provider = createProvider(providerId);

        when(providerRepository.findById(providerId)).thenReturn(Optional.of(provider));
        when(ticketRepository.existsByUser_IdAndAssignedServiceProvider_IdAndStatus(
            reviewerId, providerId, TicketStatus.COMPLETED)).thenReturn(false);

        ApiException ex = assertThrows(ApiException.class,
            () -> reviewService.upsertReview(reviewerId, providerId, createRequest(4, "Brez zahtevka")));

        assertEquals("You can leave a review only after a completed ticket with this provider.", ex.getMessage());
        verifyNoInteractions(reviewRepository, userRepository, notificationService);
    }

    @Test
    void upsertReview_koPriNoviOceniUporabnikNeObstaja_najSproziResourceNotFoundExceptionInNeShraniOcene() {
        UUID reviewerId = UUID.fromString("11111111-1111-1111-1111-111111111111");
        UUID providerId = UUID.fromString("22222222-2222-2222-2222-222222222222");
        Provider provider = createProvider(providerId);

        when(providerRepository.findById(providerId)).thenReturn(Optional.of(provider));
        when(ticketRepository.existsByUser_IdAndAssignedServiceProvider_IdAndStatus(
            reviewerId, providerId, TicketStatus.COMPLETED)).thenReturn(true);
        when(reviewRepository.findByReviewerIdAndProviderId(reviewerId, providerId))
            .thenReturn(Optional.empty());
        when(userRepository.findById(reviewerId)).thenReturn(Optional.empty());

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class,
            () -> reviewService.upsertReview(reviewerId, providerId, createRequest(5, "Komentar")));

        assertEquals("User not found.", ex.getMessage());
        verify(reviewRepository, never()).save(any());
        verifyNoInteractions(notificationService);
    }

    @Test
    void upsertReview_koPosiljanjeObvestilaSproziIzjemo_najUjameIzjemoInVseenoVrneShranjenoOceno() {
        UUID reviewerId = UUID.fromString("11111111-1111-1111-1111-111111111111");
        UUID providerId = UUID.fromString("22222222-2222-2222-2222-222222222222");
        User reviewer = createReviewer(reviewerId);
        Provider provider = createProvider(providerId);

        when(providerRepository.findById(providerId)).thenReturn(Optional.of(provider));
        when(ticketRepository.existsByUser_IdAndAssignedServiceProvider_IdAndStatus(
            reviewerId, providerId, TicketStatus.COMPLETED)).thenReturn(true);
        when(reviewRepository.findByReviewerIdAndProviderId(reviewerId, providerId))
            .thenReturn(Optional.empty());
        when(userRepository.findById(reviewerId)).thenReturn(Optional.of(reviewer));
        when(reviewRepository.save(any(Review.class))).thenAnswer(inv -> inv.getArgument(0));
        doThrow(new RuntimeException("WebSocket posrednik ni dosegljiv"))
            .when(notificationService).notifyReviewReceived(any(), any(), any(), any(), any(), any());

        ReviewResponse actual = assertDoesNotThrow(
            () -> reviewService.upsertReview(reviewerId, providerId, createRequest(5, "Odlično")));

        assertNotNull(actual);
        assertEquals(5, actual.getRating());
        verify(reviewRepository).save(any(Review.class));
        verify(notificationService).notifyReviewReceived(any(), any(), any(), any(), any(), any());
    }

    @Test
    void upsertReview_koJeReviewerIdNull_najSproziApiExceptionBrezKlicaRepozitorijev() {
        UUID providerId = UUID.fromString("22222222-2222-2222-2222-222222222222");
        CreateReviewRequest request = createRequest(5, "Komentar");

        assertThrows(ApiException.class,
            () -> reviewService.upsertReview(null, providerId, request));

        verifyNoInteractions(providerRepository, ticketRepository, reviewRepository, userRepository, notificationService);
    }

    @Test
    void upsertReview_koJeProviderIdNull_najSproziApiExceptionBrezKlicaRepozitorijev() {
        UUID reviewerId = UUID.fromString("11111111-1111-1111-1111-111111111111");
        CreateReviewRequest request = createRequest(5, "Komentar");

        assertThrows(ApiException.class,
            () -> reviewService.upsertReview(reviewerId, null, request));

        verifyNoInteractions(providerRepository, ticketRepository, reviewRepository, userRepository, notificationService);
    }
}
