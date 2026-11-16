import type { BrowserContext, Page, WebSocketRoute } from '@playwright/test';

export const CUSTOMER_USER = {
  id: 'cust-luka-001',
  email: 'luka.grobelnik@fixitnow.si',
  firstName: 'Luka',
  lastName: 'Grobelnik',
  emailVerified: true,
  profilePictureUrl: null,
  phoneNumber: '+386 41 111 222',
  createdAt: '2026-10-01T10:00:00Z',
  notificationPreferences: {},
  location: {
    address: 'Smetanova ulica 17, 2000 Maribor',
    latitude: 46.559,
    longitude: 15.638,
  },
};

export const CUSTOMER_JAN = {
  id: 'cust-jan-001',
  email: 'jan.test@fixitnow.si',
  firstName: 'Jan',
  lastName: 'Mrkonjič',
  emailVerified: true,
  profilePictureUrl: null as string | null,
  phoneNumber: '+386 41 555 123',
  createdAt: '2026-10-15T10:00:00Z',
  notificationPreferences: {},
  location: null as {
    address: string;
    latitude: number;
    longitude: number;
  } | null,
};

export const PROVIDER_LUKA = {
  id: 'prov-luka-006',
  email: 'luka.kovac@fixitnow.si',
  firstName: 'Luka',
  lastName: 'Kovač',
  phoneNumber: '+386 40 777 888',
  locationStreetName: 'Koroška cesta',
  locationStreetNumber: '46',
  locationCity: 'Maribor',
  locationPostalCode: '2000',
  locationCountry: 'Slovenia',
  locationLat: 46.5594,
  locationLon: 15.6368,
  pricePerHour: 55,
  yearsOfExperience: 7,
  serviceRadiusKm: 30,
  categories: ['ELECTRICAL', 'IT_SUPPORT'],
  bio: 'Pooblaščeni elektroinštalater za razdelilne omarice, varovalke in hišne inštalacije.',
  profilePictureUrl: null,
  status: 'ACTIVE',
  createdAt: '2026-09-26T08:00:00Z',
  approvedAt: '2026-09-27T08:00:00Z',
  emailVerified: true,
  distanceKm: 1.2,
};

export const PROVIDER_MATEJ = {
  id: 'prov-matej-001',
  email: 'matej.novak@fixitnow.si',
  firstName: 'Matej',
  lastName: 'Novak',
  phoneNumber: '+386 31 222 333',
  locationStreetName: 'Gosposvetska cesta',
  locationStreetNumber: '20',
  locationCity: 'Maribor',
  locationPostalCode: '2000',
  locationCountry: 'Slovenia',
  locationLat: 46.561,
  locationLon: 15.642,
  pricePerHour: 45,
  yearsOfExperience: 8,
  serviceRadiusKm: 25,
  categories: ['PLUMBING'],
  bio: 'Izkušen vodovodni inštalater za nujna in redna popravila vodovodnih inštalacij.',
  profilePictureUrl: null,
  status: 'ACTIVE',
  createdAt: '2026-09-15T08:00:00Z',
  approvedAt: '2026-09-16T08:00:00Z',
  emailVerified: true,
  distanceKm: 1.4,
  bankAccountHolder: 'Matej Novak s.p.',
  bankIban: 'SI56020170014356205',
  bankBic: 'LJBASI2X',
  bankName: 'NLB d.d.',
};

export const ALL_PROVIDERS = [
  PROVIDER_MATEJ,
  {
    id: 'prov-gregor-002',
    firstName: 'Gregor',
    lastName: 'Kovač',
    locationStreetName: 'Partizanska cesta',
    locationStreetNumber: '12',
    locationCity: 'Maribor',
    locationPostalCode: '2000',
    locationCountry: 'Slovenia',
    locationLat: 46.557,
    locationLon: 15.651,
    pricePerHour: 35,
    yearsOfExperience: 6,
    serviceRadiusKm: 30,
    categories: ['PLUMBING'],
    bio: 'Hitra menjava ventilov, pip in odmaševanje odtokov.',
    profilePictureUrl: null,
    status: 'ACTIVE',
    createdAt: '2026-09-18T08:00:00Z',
    emailVerified: true,
    distanceKm: 2.1,
  },
  {
    id: 'prov-bojan-003',
    firstName: 'Bojan',
    lastName: 'Horvat',
    locationStreetName: 'Titova cesta',
    locationStreetNumber: '40',
    locationCity: 'Maribor',
    locationPostalCode: '2000',
    locationCountry: 'Slovenia',
    locationLat: 46.548,
    locationLon: 15.649,
    pricePerHour: 60,
    yearsOfExperience: 12,
    serviceRadiusKm: 40,
    categories: ['PLUMBING'],
    bio: 'Celovite prenove kopalnic in vodovodnih sistemov.',
    profilePictureUrl: null,
    status: 'ACTIVE',
    createdAt: '2026-09-20T08:00:00Z',
    emailVerified: true,
    distanceKm: 3.0,
  },
  {
    id: 'prov-tomaz-004',
    firstName: 'Tomaž',
    lastName: 'Zupan',
    locationStreetName: 'Koroška cesta',
    locationStreetNumber: '5',
    locationCity: 'Maribor',
    locationPostalCode: '2000',
    locationCountry: 'Slovenia',
    locationLat: 46.558,
    locationLon: 15.635,
    pricePerHour: 40,
    yearsOfExperience: 2,
    serviceRadiusKm: 20,
    categories: ['PLUMBING'],
    bio: 'Mlajši vodovodar za manjša hišna popravila.',
    profilePictureUrl: null,
    status: 'ACTIVE',
    createdAt: '2026-09-22T08:00:00Z',
    emailVerified: true,
    distanceKm: 1.8,
  },
  {
    id: 'prov-marko-005',
    firstName: 'Marko',
    lastName: 'Krajnc',
    locationStreetName: 'Tržaška cesta',
    locationStreetNumber: '10',
    locationCity: 'Maribor',
    locationPostalCode: '2000',
    locationCountry: 'Slovenia',
    locationLat: 46.540,
    locationLon: 15.630,
    pricePerHour: 42,
    yearsOfExperience: 10,
    serviceRadiusKm: 35,
    categories: ['ELECTRICAL'],
    bio: 'Elektroinštalacije, pametni dom in meritve.',
    profilePictureUrl: null,
    status: 'ACTIVE',
    createdAt: '2026-09-25T08:00:00Z',
    emailVerified: true,
    distanceKm: 4.2,
  },
  PROVIDER_LUKA,
];

function createJwt(payload: {
  sub: string;
  role: 'CUSTOMER' | 'PROVIDER' | 'ADMIN';
  firstName: string;
  lastName: string;
}): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const nowSec = Math.floor(Date.now() / 1000);
  const body = Buffer.from(
    JSON.stringify({
      ...payload,
      iat: nowSec - 60,
      exp: nowSec + 7200,
    }),
  ).toString('base64url');
  return `${header}.${body}.e2e-signature`;
}

export async function authenticateContext(
  context: BrowserContext,
  role: 'CUSTOMER' | 'PROVIDER',
) {
  const session =
    role === 'CUSTOMER'
      ? {
          accessToken: createJwt({
            sub: CUSTOMER_USER.email,
            role: 'CUSTOMER',
            firstName: CUSTOMER_USER.firstName,
            lastName: CUSTOMER_USER.lastName,
          }),
          refreshToken: 'refresh-token-customer',
          tempToken: '',
          role: 'CUSTOMER',
        }
      : {
          accessToken: createJwt({
            sub: PROVIDER_MATEJ.email,
            role: 'PROVIDER',
            firstName: PROVIDER_MATEJ.firstName,
            lastName: PROVIDER_MATEJ.lastName,
          }),
          refreshToken: 'refresh-token-provider',
          tempToken: '',
          role: 'PROVIDER',
        };

  await context.addInitScript((sessionData) => {
    window.localStorage.setItem('frontend.auth.persistent', 'true');
    window.localStorage.setItem('frontend.auth.session', JSON.stringify(sessionData));
    window.localStorage.setItem('i18nextLng', 'en');
  }, session);
}

export async function authenticateJanContext(context: BrowserContext) {
  const session = {
    accessToken: createJwt({
      sub: CUSTOMER_JAN.email,
      role: 'CUSTOMER',
      firstName: CUSTOMER_JAN.firstName,
      lastName: CUSTOMER_JAN.lastName,
    }),
    refreshToken: 'refresh-token-jan',
    tempToken: '',
    role: 'CUSTOMER',
  };

  await context.addInitScript((sessionData) => {
    window.localStorage.setItem('frontend.auth.persistent', 'true');
    window.localStorage.setItem('frontend.auth.session', JSON.stringify(sessionData));
    window.localStorage.setItem('i18nextLng', 'en');
  }, session);
}

interface StompSub {
  destination: string;
  subId: string;
  send: (rawSockJsPayload: string) => void;
}

export class MockBackend {
  savedProviderIds = new Set<string>();
  ticket42: Record<string, unknown>;
  ticket88: Record<string, unknown> | null = null;
  janUser = { ...CUSTOMER_JAN };
  janHasActiveTickets = true;
  reviews: Array<{
    id: string;
    providerId: string;
    reviewerId: string;
    reviewerName: string;
    reviewerProfilePictureUrl: string | null;
    rating: number;
    comment: string | null;
    createdAt: string;
    updatedAt: string;
  }> = [];
  chatMessages: Array<{
    id: number;
    senderId: string;
    recipientId: string;
    chatRoomId: string;
    content: string;
    type: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
    status: 'SENT' | 'DELIVERED' | 'READ';
    timestamp: string;
    deliveredAt?: string | null;
    readAt?: string | null;
    editedAt?: string | null;
    deleted?: boolean;
  }> = [];
  notificationsByUser = new Map<
    string,
    Array<{
      id: number;
      type: string;
      title: string;
      body: string | null;
      titleKey: string | null;
      bodyKey: string | null;
      params: Record<string, string> | null;
      ticketId: number | null;
      chatRoomId: string | null;
      aggregateCount: number;
      read: boolean;
      createdAt: string;
    }>
  >();

  private nextMsgId = 101;
  private nextNotifId = 501;
  private stompSubs = new Set<StompSub>();

  constructor() {
    this.ticket42 = {
      id: 42,
      serviceType: 'Kitchen faucet repair',
      category: 'PLUMBING',
      description: 'Kitchen sink faucet is leaking under the cabinet.',
      location: 'Smetanova ulica 17, 2000 Maribor',
      status: 'PENDING_APPROVAL',
      priority: 'HIGH',
      estimatedCost: null,
      createdAt: '2026-11-04T09:00:00Z',
      assignedServiceProviderName: 'Matej Novak',
      assignedServiceProviderId: PROVIDER_MATEJ.id,
      assignedServiceProviderProfilePictureUrl: null,
      submittedByName: 'Luka Grobelnik',
      submittedById: CUSTOMER_USER.id,
      submittedByProfilePictureUrl: null,
      customerPhoneNumber: CUSTOMER_USER.phoneNumber,
      chatRoomId: 'room-fix-0042',
      requestedStartAt: '2026-11-05T14:00:00Z',
      requestedEndAt: '2026-11-05T16:00:00Z',
      statusHistory: [
        { status: 'PENDING_APPROVAL', changedAt: '2026-11-04T09:00:00Z' },
      ],
      imageUrls: [],
      bankAccountHolder: PROVIDER_MATEJ.bankAccountHolder,
      bankIban: PROVIDER_MATEJ.bankIban,
      bankBic: PROVIDER_MATEJ.bankBic,
      bankName: PROVIDER_MATEJ.bankName,
      bankRecipientStreet: `${PROVIDER_MATEJ.locationStreetName} ${PROVIDER_MATEJ.locationStreetNumber}`,
      bankRecipientCity: `${PROVIDER_MATEJ.locationPostalCode} ${PROVIDER_MATEJ.locationCity}`,
    };

    this.notificationsByUser.set(CUSTOMER_USER.id, [
      {
        id: 500,
        type: 'TICKET_STATUS_CHANGE',
        title: 'Ticket FIX-0042',
        body: 'Provider accepted — ticket approved.',
        titleKey: 'notifications.ticket.title',
        bodyKey: 'notifications.ticket.body.APPROVED',
        params: { code: 'FIX-0042' },
        ticketId: 42,
        chatRoomId: 'room-fix-0042',
        aggregateCount: 1,
        read: false,
        createdAt: new Date(Date.now() - 120_000).toISOString(),
      },
    ]);
    this.notificationsByUser.set(PROVIDER_MATEJ.id, []);
  }

  private broadcastStomp(destination: string, payload: unknown) {
    const bodyStr = JSON.stringify(payload);
    for (const sub of this.stompSubs) {
      if (sub.destination === destination) {
        const frame =
          `MESSAGE\n` +
          `destination:${destination}\n` +
          `subscription:${sub.subId}\n` +
          `message-id:msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}\n` +
          `content-type:application/json\n\n` +
          `${bodyStr}\u0000`;
        sub.send(`a${JSON.stringify([frame])}`);
      }
    }
  }

  private pushNotification(userId: string, notif: {
    type: string;
    title: string;
    body: string | null;
    titleKey: string | null;
    bodyKey: string | null;
    params: Record<string, string> | null;
    ticketId: number | null;
    chatRoomId: string | null;
  }) {
    const list = this.notificationsByUser.get(userId) ?? [];
    const created = {
      id: this.nextNotifId++,
      ...notif,
      aggregateCount: 1,
      read: false,
      createdAt: new Date().toISOString(),
    };
    this.notificationsByUser.set(userId, [created, ...list]);
    this.broadcastStomp(`/topic/notifications/${userId}`, created);
  }

  async attachToContext(context: BrowserContext) {
    if (process.env.USE_LIVE_BACKEND === 'true') {
      return;
    }

    // Intercept SockJS WebSocket connections (/ws/{server}/{session}/websocket)
    await context.routeWebSocket(/\/ws\/[^/]+\/[^/]+\/websocket$/, (ws: WebSocketRoute) => {
      const clientSubs: StompSub[] = [];
      const sendRaw = (data: string) => {
        try {
          ws.send(data);
        } catch {
          // Socket already closed
        }
      };

      // SockJS open frame (defer slightly so browser onopen/onmessage are ready)
      setTimeout(() => sendRaw('o'), 10);

      ws.onMessage((message) => {
        const text = typeof message === 'string' ? message : message.toString('utf-8');
        let frames: string[] = [];
        try {
          frames = JSON.parse(text) as string[];
        } catch {
          frames = [text];
        }

        for (const rawFrame of frames) {
          if (rawFrame.startsWith('CONNECT') || rawFrame.startsWith('STOMP')) {
            const connectedFrame = `CONNECTED\nversion:1.2\nheart-beat:0,0\n\n\u0000`;
            sendRaw(`a${JSON.stringify([connectedFrame])}`);
          } else if (rawFrame.startsWith('SUBSCRIBE')) {
            const destMatch = rawFrame.match(/destination:([^\r\n]+)/);
            const idMatch = rawFrame.match(/id:([^\r\n]+)/);
            if (destMatch && idMatch) {
              const sub: StompSub = {
                destination: destMatch[1].trim(),
                subId: idMatch[1].trim(),
                send: sendRaw,
              };
              clientSubs.push(sub);
              this.stompSubs.add(sub);
            }
          } else if (rawFrame.startsWith('UNSUBSCRIBE')) {
            const idMatch = rawFrame.match(/id:([^\r\n]+)/);
            if (idMatch) {
              const id = idMatch[1].trim();
              for (const s of [...clientSubs]) {
                if (s.subId === id) {
                  this.stompSubs.delete(s);
                }
              }
            }
          } else if (rawFrame.startsWith('SEND')) {
            const destMatch = rawFrame.match(/destination:([^\r\n]+)/);
            const dest = destMatch ? destMatch[1].trim() : '';
            const bodyStart = rawFrame.indexOf('\n\n');
            const bodyRaw = bodyStart >= 0 ? rawFrame.slice(bodyStart + 2).replace(/\0$/, '') : '{}';
            let payload: Record<string, unknown> = {};
            try {
              payload = JSON.parse(bodyRaw) as Record<string, unknown>;
            } catch {
              payload = {};
            }

            if (dest === '/app/chat.send') {
              const msg = {
                id: this.nextMsgId++,
                senderId: String(payload.senderId ?? CUSTOMER_USER.id),
                recipientId: String(payload.recipientId ?? PROVIDER_MATEJ.id),
                chatRoomId: String(payload.chatRoomId ?? 'room-fix-0042'),
                content: String(payload.content ?? ''),
                type: (payload.type as 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM') ?? 'TEXT',
                status: 'SENT' as const,
                timestamp: new Date().toISOString(),
                deliveredAt: null,
                readAt: null,
                editedAt: null,
                deleted: false,
              };
              this.chatMessages.unshift(msg);
              this.broadcastStomp(`/topic/chat/${msg.chatRoomId}`, msg);

              const senderName =
                msg.senderId === CUSTOMER_USER.id
                  ? `${CUSTOMER_USER.firstName} ${CUSTOMER_USER.lastName}`
                  : `${PROVIDER_MATEJ.firstName} ${PROVIDER_MATEJ.lastName}`;
              this.pushNotification(msg.recipientId, {
                type: 'NEW_MESSAGE',
                title: senderName,
                body: msg.content,
                titleKey: null,
                bodyKey: null,
                params: null,
                ticketId: 42,
                chatRoomId: msg.chatRoomId,
              });
            } else if (dest === '/app/chat.edit') {
              const msgId = Number(payload.messageId);
              const content = String(payload.content ?? '');
              const target = this.chatMessages.find((m) => m.id === msgId);
              if (target) {
                target.content = content;
                target.editedAt = new Date().toISOString();
                this.broadcastStomp(`/topic/chat/${target.chatRoomId}`, target);
              }
            } else if (dest === '/app/chat.delete') {
              const msgId = Number(payload.messageId);
              const target = this.chatMessages.find((m) => m.id === msgId);
              if (target) {
                target.deleted = true;
                this.broadcastStomp(`/topic/chat/${target.chatRoomId}`, target);
              }
            } else if (dest === '/app/chat.status') {
              const msgId = Number(payload.messageId);
              const status = (payload.status as 'DELIVERED' | 'READ') ?? 'READ';
              const target = this.chatMessages.find((m) => m.id === msgId);
              if (target) {
                target.status = status;
                if (status === 'READ') target.readAt = new Date().toISOString();
                this.broadcastStomp(`/topic/chat/${target.chatRoomId}/status`, target);
              }
            }
          }
        }
      });

      ws.onClose(() => {
        for (const s of clientSubs) {
          this.stompSubs.delete(s);
        }
      });
    });

    // Intercept HTTP requests to backend (:8080)
    await context.route(/http:\/\/localhost:8080\/.*/, async (route) => {
      const req = route.request();
      const url = new URL(req.url());
      const path = url.pathname;
      const method = req.method();

      const origin = req.headers()['origin'] ?? 'http://localhost:5173';
      const corsHeaders = {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Requested-With',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      };

      const json = (data: unknown, status = 200) =>
        route.fulfill({
          status,
          contentType: 'application/json',
          headers: corsHeaders,
          body: JSON.stringify(data),
        });

      if (method === 'OPTIONS') {
        return route.fulfill({
          status: 204,
          headers: corsHeaders,
        });
      }

      // SockJS info endpoint
      if (path.startsWith('/ws/info')) {
        return json({
          websocket: true,
          origins: ['*:*'],
          cookie_needed: false,
          entropy: 123456789,
        });
      }

      // Public platform stats
      if (path === '/api/v1/public/stats' && method === 'GET') {
        return json({
          activeProvidersCount: 48,
          averageRating: 4.85,
          medianResponseMinutes: 14,
          averageHourlyRate: 48,
          platformFeePercent: 8,
        });
      }

      // Auth registration, login & 2FA verification (TS-04)
      if (path === '/api/v1/auth/register' && method === 'POST') {
        return json({ message: 'User registered successfully.' }, 201);
      }

      if (path === '/api/v1/auth/register/provider' && method === 'POST') {
        return json({ message: 'Provider application submitted.' }, 201);
      }

      if (path === '/api/v1/auth/login' && method === 'POST') {
        const body = JSON.parse(req.postData() ?? '{}') as {
          email?: string;
          password?: string;
        };
        if (body.email === CUSTOMER_JAN.email) {
          return json({
            accessToken: '',
            refreshToken: '',
            tokenType: 'Bearer',
            role: 'CUSTOMER',
            requiresTwoFactor: true,
            tempToken: 'temp-2fa-token-jan-001',
          });
        }
        return json({
          accessToken: createJwt({
            sub: CUSTOMER_USER.email,
            role: 'CUSTOMER',
            firstName: CUSTOMER_USER.firstName,
            lastName: CUSTOMER_USER.lastName,
          }),
          refreshToken: 'refresh-token-customer',
          tokenType: 'Bearer',
          role: 'CUSTOMER',
          requiresTwoFactor: false,
          tempToken: '',
        });
      }

      if (path === '/api/v1/auth/2fa/verify' && method === 'POST') {
        const body = JSON.parse(req.postData() ?? '{}') as {
          tempToken?: string;
          code?: string;
        };
        if (body.code === '482910') {
          return json({
            accessToken: createJwt({
              sub: this.janUser.email,
              role: 'CUSTOMER',
              firstName: this.janUser.firstName,
              lastName: this.janUser.lastName,
            }),
            refreshToken: 'refresh-token-jan',
            tokenType: 'Bearer',
            role: 'CUSTOMER',
            requiresTwoFactor: false,
            tempToken: '',
          });
        }
        return json({ message: 'Invalid 2FA verification code.' }, 400);
      }

      // Geocode autocomplete (TS-05 & TS-06)
      if (path === '/api/v1/geocode/search' && method === 'GET') {
        const q = (url.searchParams.get('q') ?? '').toLowerCase();
        if (q.includes('slom')) {
          return json([
            {
              displayName: 'Slomškov trg 15, 2000 Maribor, Slovenija',
              lat: 46.5592,
              lng: 15.6448,
            },
          ]);
        }
        return json([
          {
            displayName: 'Koroška cesta 46, 2000 Maribor, Slovenija',
            lat: 46.5594,
            lng: 15.6368,
          },
        ]);
      }

      // Image upload (TS-05)
      if (path === '/api/v1/images/upload' && method === 'POST') {
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240" viewBox="0 0 320 240"><rect width="320" height="240" fill="#1e293b"/><rect x="40" y="30" width="240" height="180" rx="8" fill="#334155" stroke="#94a3b8" stroke-width="3"/><rect x="70" y="65" width="45" height="90" rx="4" fill="#0f172a"/><rect x="135" y="65" width="45" height="90" rx="4" fill="#ef4444"/><rect x="200" y="65" width="45" height="90" rx="4" fill="#0f172a"/><text x="160" y="192" text-anchor="middle" fill="#f8fafc" font-family="monospace" font-size="14">FAULT: FUSE B16</text></svg>`;
        return json({
          url: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
        });
      }

      // Auth & Current User / Provider
      if (path === '/api/v1/users/me' && method === 'GET') {
        const auth = req.headers()['authorization'] ?? '';
        if (auth.includes('PROVIDER') || this.isProviderToken(auth)) {
          return json({
            id: PROVIDER_MATEJ.id,
            email: PROVIDER_MATEJ.email,
            firstName: PROVIDER_MATEJ.firstName,
            lastName: PROVIDER_MATEJ.lastName,
            emailVerified: true,
            profilePictureUrl: null,
            phoneNumber: PROVIDER_MATEJ.phoneNumber,
            createdAt: PROVIDER_MATEJ.createdAt,
            notificationPreferences: {},
            location: null,
          });
        }
        if (this.isJanToken(auth)) {
          return json(this.janUser);
        }
        return json(CUSTOMER_USER);
      }

      if (path === '/api/v1/users/me' && method === 'PATCH') {
        const body = JSON.parse(req.postData() ?? '{}') as {
          firstName?: string;
          lastName?: string;
          phoneNumber?: string | null;
        };
        this.janUser = {
          ...this.janUser,
          firstName: body.firstName ?? this.janUser.firstName,
          lastName: body.lastName ?? this.janUser.lastName,
          phoneNumber:
            body.phoneNumber !== undefined ? (body.phoneNumber ?? '') : this.janUser.phoneNumber,
        };
        return json(this.janUser);
      }

      if (path === '/api/v1/users/me/location' && method === 'PATCH') {
        const body = JSON.parse(req.postData() ?? '{}') as {
          address: string;
          latitude?: number | null;
          longitude?: number | null;
        };
        this.janUser = {
          ...this.janUser,
          location: {
            address: body.address,
            latitude: body.latitude ?? 46.5592,
            longitude: body.longitude ?? 15.6448,
          },
        };
        return json(this.janUser);
      }

      if (path === '/api/v1/users/me/location' && method === 'DELETE') {
        this.janUser = { ...this.janUser, location: null };
        return json(this.janUser);
      }

      if (path === '/api/v1/users/me/password' && method === 'PATCH') {
        return json({ message: 'Password updated successfully.' });
      }

      if (path === '/api/v1/users/me' && method === 'DELETE') {
        if (this.janHasActiveTickets) {
          return json(
            {
              message:
                'You cannot delete your account while you have active tickets, disputes, or pending payments.',
            },
            400,
          );
        }
        return json({ message: 'Account deleted successfully.' });
      }

      if (path === '/api/v1/providers/me' && method === 'GET') {
        return json(PROVIDER_MATEJ);
      }

      if (path.startsWith('/api/v1/providers/me/calendar')) {
        return json([]);
      }

      // Categories
      if (path === '/api/v1/providers/categories' && method === 'GET') {
        return json(['PLUMBING', 'ELECTRICAL', 'CARPENTRY', 'HVAC', 'PAINTING']);
      }

      // Search Providers
      if (path === '/api/v1/providers/search' && method === 'GET') {
        const q = (url.searchParams.get('query') ?? '').trim().toLowerCase();
        const cats = url.searchParams.getAll('categories');
        const minPrice = Number(url.searchParams.get('minPrice') ?? '0');
        const maxPrice = Number(url.searchParams.get('maxPrice') ?? '999999');
        const minExp = Number(url.searchParams.get('minYearsOfExperience') ?? '0');

        const filtered = ALL_PROVIDERS.filter((p) => {
          if (q) {
            const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
            const catStr = p.categories.join(' ').toLowerCase();
            if (!fullName.includes(q) && !catStr.includes(q)) return false;
          }
          if (cats.length > 0 && !p.categories.some((c) => cats.includes(c))) {
            return false;
          }
          if (p.pricePerHour < minPrice || p.pricePerHour > maxPrice) {
            return false;
          }
          if (p.yearsOfExperience < minExp) {
            return false;
          }
          return true;
        });

        return json({
          content: filtered,
          totalPages: 1,
          totalElements: filtered.length,
        });
      }

      // Saved Providers
      if (path === '/api/v1/saved-providers' && method === 'GET') {
        const saved = ALL_PROVIDERS.filter((p) => this.savedProviderIds.has(p.id));
        return json(saved);
      }

      const savedMatch = path.match(/^\/api\/v1\/saved-providers\/([^/]+)$/);
      if (savedMatch) {
        const provId = savedMatch[1];
        if (method === 'POST') {
          this.savedProviderIds.add(provId);
          return json({ message: 'Provider saved' });
        }
        if (method === 'DELETE') {
          this.savedProviderIds.delete(provId);
          return json({ message: 'Provider unsaved' });
        }
      }

      // Provider reviews & stats
      const reviewStatsMatch = path.match(/^\/api\/v1\/providers\/([^/]+)\/reviews\/stats$/);
      if (reviewStatsMatch && method === 'GET') {
        const provId = reviewStatsMatch[1];
        const provReviews = this.reviews.filter((r) => r.providerId === provId);
        const count = provReviews.length;
        const avg =
          count > 0
            ? provReviews.reduce((acc, r) => acc + r.rating, 0) / count
            : null;
        return json({
          providerId: provId,
          averageRating: avg,
          reviewCount: count,
        });
      }

      const reviewsMatch = path.match(/^\/api\/v1\/providers\/([^/]+)\/reviews$/);
      if (reviewsMatch) {
        const provId = reviewsMatch[1];
        if (method === 'GET') {
          return json(this.reviews.filter((r) => r.providerId === provId));
        }
        if (method === 'POST') {
          const body = JSON.parse(req.postData() ?? '{}') as {
            rating: number;
            comment?: string | null;
          };
          const existingIdx = this.reviews.findIndex(
            (r) => r.providerId === provId && r.reviewerId === CUSTOMER_USER.id,
          );
          const nowIso = new Date().toISOString();
          if (existingIdx >= 0) {
            this.reviews[existingIdx] = {
              ...this.reviews[existingIdx],
              rating: body.rating,
              comment: body.comment ?? null,
              updatedAt: nowIso,
            };
            return json(this.reviews[existingIdx]);
          }
          const created = {
            id: `rev-${Date.now()}`,
            providerId: provId,
            reviewerId: CUSTOMER_USER.id,
            reviewerName: `${CUSTOMER_USER.firstName} ${CUSTOMER_USER.lastName}`,
            reviewerProfilePictureUrl: null,
            rating: body.rating,
            comment: body.comment ?? null,
            createdAt: nowIso,
            updatedAt: nowIso,
          };
          this.reviews.unshift(created);
          return json(created);
        }
        if (method === 'DELETE') {
          this.reviews = this.reviews.filter(
            (r) => !(r.providerId === provId && r.reviewerId === CUSTOMER_USER.id),
          );
          return json({ message: 'Review deleted' });
        }
      }

      const calMatch = path.match(/^\/api\/v1\/providers\/([^/]+)\/calendar$/);
      if (calMatch && method === 'GET') {
        const provId = calMatch[1];
        if (provId === PROVIDER_LUKA.id) {
          const now = new Date();
          const pad = (n: number) => String(n).padStart(2, '0');
          const fmtIso = (d: Date) =>
            `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;

          // Pick tomorrow 10:00–14:00 (or today if today is Sunday so it stays in the current Mon–Sun week)
          const slotDay = new Date(now);
          if (now.getDay() !== 0) {
            slotDay.setDate(slotDay.getDate() + 1);
          }
          const start = new Date(slotDay);
          start.setHours(10, 0, 0, 0);
          const end = new Date(slotDay);
          end.setHours(14, 0, 0, 0);
          if (end.getTime() <= now.getTime() + 30 * 60 * 1000) {
            start.setHours(20, 0, 0, 0);
            end.setHours(23, 30, 0, 0);
          }

          return json([
            {
              startAt: fmtIso(start),
              endAt: fmtIso(end),
              type: 'AVAILABLE',
              label: 'Available',
            },
          ]);
        }
        return json([]);
      }

      const provByIdMatch = path.match(/^\/api\/v1\/providers\/([^/]+)$/);
      if (provByIdMatch && method === 'GET') {
        const id = provByIdMatch[1];
        const found = ALL_PROVIDERS.find((p) => p.id === id) ?? PROVIDER_MATEJ;
        return json(found);
      }

      // Tickets
      if (path === '/api/tickets' && method === 'GET') {
        const auth = req.headers()['authorization'] ?? '';
        if (this.isJanToken(auth)) {
          return json(this.ticket88 ? [this.ticket88] : []);
        }
        return json([this.ticket42]);
      }

      if (path === '/api/tickets' && method === 'POST') {
        const body = JSON.parse(req.postData() ?? '{}') as {
          serviceType?: string;
          category?: string;
          description?: string;
          location?: string;
          priority?: string;
          assignedProviderId?: string | null;
          requestedStartAt?: string | null;
          requestedEndAt?: string | null;
          imageUrls?: string[];
        };
        const nowIso = new Date().toISOString();
        this.ticket88 = {
          id: 88,
          serviceType: body.serviceType ?? 'Menjava okvarjene varovalke v razdelilni omarici',
          category: body.category ?? 'ELECTRICAL',
          description:
            body.description ??
            'Glavna varovalka v kuhinjskem tokokrogu se ob vklopu pečice sproži, potrebna menjava in pregled napeljave.',
          location: body.location ?? 'Koroška cesta 46, 2000 Maribor, Slovenija',
          status: 'PENDING_APPROVAL',
          priority: body.priority ?? 'HIGH',
          estimatedCost: null,
          createdAt: nowIso,
          assignedServiceProviderName: 'Luka Kovač',
          assignedServiceProviderId: body.assignedProviderId ?? PROVIDER_LUKA.id,
          assignedServiceProviderProfilePictureUrl: null,
          submittedByName: `${this.janUser.firstName} ${this.janUser.lastName}`,
          submittedById: this.janUser.id,
          submittedByProfilePictureUrl: null,
          customerPhoneNumber: this.janUser.phoneNumber,
          chatRoomId: 'room-fix-0088',
          requestedStartAt: body.requestedStartAt ?? null,
          requestedEndAt: body.requestedEndAt ?? null,
          statusHistory: [{ status: 'PENDING_APPROVAL', changedAt: nowIso }],
          imageUrls: body.imageUrls ?? [],
        };
        return json(this.ticket88, 201);
      }

      if (path === '/api/tickets/88' && method === 'GET') {
        if (this.ticket88) {
          return json(this.ticket88);
        }
        return json({ message: 'Ticket not found' }, 404);
      }

      if (path === '/api/tickets/88/cancel' && method === 'POST') {
        if (this.ticket88) {
          this.ticket88.status = 'CANCELLED';
          const history =
            (this.ticket88.statusHistory as Array<{ status: string; changedAt: string }>) ?? [];
          history.push({ status: 'CANCELLED', changedAt: new Date().toISOString() });
          this.ticket88.statusHistory = history;
          return json(this.ticket88);
        }
        return json({ message: 'Ticket not found' }, 404);
      }
      if (path === '/api/tickets/provider' && method === 'GET') {
        return json([this.ticket42]);
      }
      if (path === '/api/tickets/open' && method === 'GET') {
        return json([]);
      }

      if (path === '/api/tickets/42' && method === 'GET') {
        return json(this.ticket42);
      }

      if (path === '/api/tickets/42/confirm' && method === 'POST') {
        this.advanceTicketStatus('APPROVED');
        return json(this.ticket42);
      }

      if (path === '/api/tickets/42/accept' && method === 'POST') {
        this.advanceTicketStatus('APPROVED');
        return json(this.ticket42);
      }

      if (path === '/api/tickets/42/status' && method === 'PUT') {
        const newStatus = url.searchParams.get('newStatus') ?? 'APPROVED';
        this.advanceTicketStatus(newStatus);
        return json(this.ticket42);
      }

      if (path === '/api/tickets/42/tracking' && method === 'GET') {
        return json({
          ticketId: 42,
          providerLat: 46.561,
          providerLng: 15.642,
          heading: 180,
          destLat: 46.559,
          destLng: 15.638,
          destAddress: 'Smetanova ulica 17, 2000 Maribor',
          distanceMeters: 420,
          etaSeconds: 180,
          nearby: false,
          updatedAt: new Date().toISOString(),
        });
      }

      if (path === '/api/tickets/42/invoice' && method === 'POST') {
        const rawBody = req.postDataBuffer()?.toString('utf-8') ?? '';
        const amountMatch = rawBody.match(/name="amount"\r?\n\r?\n([0-9.]+)/);
        const amount = amountMatch ? parseFloat(amountMatch[1]) : 65.0;
        this.ticket42.estimatedCost = amount;
        this.advanceTicketStatus('PENDING_PAYMENT');
        return json(this.ticket42);
      }

      if (path === '/api/tickets/42/payment/received' && method === 'POST') {
        this.advanceTicketStatus('COMPLETED');
        return json(this.ticket42);
      }

      // Chat endpoints
      if (path === '/api/chat/rooms' && method === 'GET') {
        const auth = req.headers()['authorization'] ?? '';
        const isProv = this.isProviderToken(auth);
        const latest = this.chatMessages[0] ?? null;
        return json([
          {
            id: 'room-fix-0042',
            otherParticipantId: isProv ? CUSTOMER_USER.id : PROVIDER_MATEJ.id,
            otherParticipantName: isProv ? 'Luka Grobelnik' : 'Matej Novak',
            otherParticipantProfilePictureUrl: null,
            lastMessageContent: latest?.content ?? null,
            lastMessageType: latest?.type ?? null,
            lastMessageTimestamp: latest?.timestamp ?? '2026-11-04T09:00:00Z',
            unreadCount: 0,
          },
        ]);
      }

      if (path === '/api/chat/room-fix-0042' && method === 'GET') {
        return json({
          id: 'room-fix-0042',
          ticketId: 42,
          customerId: CUSTOMER_USER.id,
          providerId: PROVIDER_MATEJ.id,
        });
      }

      if (path === '/api/chat/room-fix-0042/messages' && method === 'GET') {
        return json(this.chatMessages);
      }

      if (path === '/api/chat/room-fix-0088' && method === 'GET') {
        return json({
          id: 'room-fix-0088',
          ticketId: 88,
          customerId: CUSTOMER_JAN.id,
          providerId: PROVIDER_LUKA.id,
        });
      }

      if (path === '/api/chat/room-fix-0088/messages' && method === 'GET') {
        return json([]);
      }

      // Notifications endpoints
      if (path === '/api/notifications' && method === 'GET') {
        const userId = this.resolveUserIdFromHeader(req.headers()['authorization']);
        return json(this.notificationsByUser.get(userId) ?? []);
      }

      if (path === '/api/notifications/unread-count' && method === 'GET') {
        const userId = this.resolveUserIdFromHeader(req.headers()['authorization']);
        const list = this.notificationsByUser.get(userId) ?? [];
        return json({ count: list.filter((n) => !n.read).length });
      }

      const notifReadMatch = path.match(/^\/api\/notifications\/(\d+)\/read$/);
      if (notifReadMatch && method === 'PUT') {
        const id = Number(notifReadMatch[1]);
        const userId = this.resolveUserIdFromHeader(req.headers()['authorization']);
        const list = this.notificationsByUser.get(userId) ?? [];
        this.notificationsByUser.set(
          userId,
          list.map((n) => (n.id === id ? { ...n, read: true } : n)),
        );
        return json({ success: true });
      }

      if (path === '/api/notifications/read-all' && method === 'PUT') {
        const userId = this.resolveUserIdFromHeader(req.headers()['authorization']);
        const list = this.notificationsByUser.get(userId) ?? [];
        this.notificationsByUser.set(
          userId,
          list.map((n) => ({ ...n, read: true })),
        );
        return json({ success: true });
      }

      if (path === '/api/notifications' && method === 'DELETE') {
        const userId = this.resolveUserIdFromHeader(req.headers()['authorization']);
        this.notificationsByUser.set(userId, []);
        return json({ success: true });
      }

      return json({});
    });
  }

  private advanceTicketStatus(newStatus: string) {
    this.ticket42.status = newStatus;
    const history = (this.ticket42.statusHistory as Array<{ status: string; changedAt: string }>) ?? [];
    history.push({ status: newStatus, changedAt: new Date().toISOString() });
    this.ticket42.statusHistory = history;
  }

  private isProviderToken(authHeader?: string): boolean {
    if (!authHeader) return false;
    try {
      const token = authHeader.replace(/^Bearer\s+/i, '');
      const payload = JSON.parse(
        Buffer.from(token.split('.')[1] ?? '', 'base64url').toString('utf-8'),
      ) as { role?: string };
      return payload.role === 'PROVIDER';
    } catch {
      return false;
    }
  }

  private isJanToken(authHeader?: string): boolean {
    if (!authHeader) return false;
    try {
      const token = authHeader.replace(/^Bearer\s+/i, '');
      const payload = JSON.parse(
        Buffer.from(token.split('.')[1] ?? '', 'base64url').toString('utf-8'),
      ) as { sub?: string };
      return payload.sub === CUSTOMER_JAN.email;
    } catch {
      return false;
    }
  }

  private resolveUserIdFromHeader(authHeader?: string): string {
    if (this.isProviderToken(authHeader)) return PROVIDER_MATEJ.id;
    if (this.isJanToken(authHeader)) return CUSTOMER_JAN.id;
    return CUSTOMER_USER.id;
  }
}

export async function disableServiceWorkersAndTileLoads(context: BrowserContext) {
  // Prevent external OpenStreetMap tile requests from slowing down or failing offline in headless CI
  await context.route(/https:\/\/[abc]\.tile\.openstreetmap\.org\/.*/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'image/png',
      body: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64',
      ),
    }),
  );
}

export async function suppressGeoPrompt(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'geolocation', {
      value: {
        getCurrentPosition: (success: PositionCallback) =>
          success({
            coords: {
              latitude: 46.561,
              longitude: 15.642,
              accuracy: 15,
              altitude: null,
              altitudeAccuracy: null,
              heading: 180,
              speed: 5,
              toJSON: () => ({}),
            },
            timestamp: Date.now(),
            toJSON: () => ({}),
          }),
        watchPosition: (success: PositionCallback) => {
          success({
            coords: {
              latitude: 46.561,
              longitude: 15.642,
              accuracy: 15,
              altitude: null,
              altitudeAccuracy: null,
              heading: 180,
              speed: 5,
              toJSON: () => ({}),
            },
            timestamp: Date.now(),
            toJSON: () => ({}),
          });
          return 1;
        },
        clearWatch: () => {},
      },
      configurable: true,
    });
  });
}
