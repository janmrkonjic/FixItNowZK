export type MockRole = 'PROVIDER' | 'CUSTOMER' | 'ADMIN';

export interface MockTimeBlock {
  id: string;
  startAt: string;
  endAt: string;
  type: 'AVAILABLE' | 'BREAK' | 'OFF' | 'BOOKED';
  title?: string | null;
  notes?: string | null;
  ticketId?: number | null;
  seriesId?: string | null;
}

export interface MockTicket {
  id: number;
  serviceType: string;
  category: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: string;
  location: string;
  latitude: number;
  longitude: number;
  createdAt: string;
  scheduledAt?: string | null;
  scheduledEndAt?: string | null;
  estimatedCost?: number | null;
  submittedById?: string;
  submittedByName?: string;
  assignedServiceProviderId?: string | null;
  assignedServiceProviderName?: string | null;
  statusHistory?: { status: string; changedAt: string }[];
}

export interface MockUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'CUSTOMER' | 'PROVIDER' | 'ADMIN';
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  profilePictureUrl: string | null;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
}

export interface MockState {
  currentActor: 'JANE_PROVIDER' | 'METKA_PROVIDER' | 'CUSTOMER_A' | 'CUSTOMER_B' | 'ADMIN';
  providerJane: Record<string, unknown>;
  providerMetka: Record<string, unknown>;
  calendarBlocks: MockTimeBlock[];
  connectStatus: { connected: boolean; chargesEnabled: boolean; payoutsEnabled: boolean };
  users: MockUser[];
  tickets: MockTicket[];
  nextBlockSeq: number;
  nextTicketSeq: number;
}

function makeFakeJwt(email: string, role: string, firstName: string, lastName: string): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({
      sub: email,
      email,
      role,
      firstName,
      lastName,
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
  );
  return `${header}.${payload}.mock-sig`;
}

export function setSessionInWindow(
  win: Window,
  opts: { email: string; role: MockRole; firstName: string; lastName: string },
) {
  const token = makeFakeJwt(opts.email, opts.role, opts.firstName, opts.lastName);
  win.localStorage.setItem('frontend.auth.persistent', 'true');
  win.localStorage.setItem(
    'frontend.auth.session',
    JSON.stringify({
      accessToken: token,
      refreshToken: 'mock-refresh-token',
      tempToken: '',
      role: opts.role,
    }),
  );
  win.localStorage.setItem('i18nextLng', 'en');
}

export function createInitialMockState(): MockState {
  // Use dates within the current week so FullCalendar always renders them immediately.
  const now = new Date();
  const monday = new Date(now);
  const day = monday.getDay();
  monday.setDate(monday.getDate() + (day === 0 ? -6 : 1 - day));
  const pad = (n: number) => String(n).padStart(2, '0');
  const dayIso = (offsetDays: number, hour: string) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + offsetDays);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${hour}:00`;
  };

  return {
    currentActor: 'JANE_PROVIDER',
    providerJane: {
      id: 'prov-jane-001',
      email: 'jane.doe@fixitnow.si',
      firstName: 'Jane',
      lastName: 'Doe',
      phoneNumber: '+386 41 555 111',
      locationStreetName: 'Smetanova ulica',
      locationStreetNumber: '17',
      locationCity: 'Maribor',
      locationPostalCode: '2000',
      locationCountry: 'Slovenia',
      locationLat: 46.559,
      locationLon: 15.638,
      pricePerHour: 45,
      yearsOfExperience: 6,
      serviceRadiusKm: 25,
      categories: ['PLUMBING'],
      bio: 'Reliable plumbing specialist.',
      profilePictureUrl: null,
      status: 'ACTIVE',
      emailVerified: true,
      createdAt: '2026-09-10T08:00:00Z',
      bankAccountHolder: 'Jane Doe',
      bankIban: '',
      bankBic: '',
      bankName: '',
    },
    providerMetka: {
      id: 'prov-metka-002',
      email: 'metka.horvat@fixitnow.si',
      firstName: 'Metka',
      lastName: 'Horvat',
      phoneNumber: '+386 31 444 888',
      locationStreetName: 'Titova cesta',
      locationStreetNumber: '12',
      locationCity: 'Maribor',
      locationPostalCode: '2000',
      locationCountry: 'Slovenia',
      locationLat: 46.554,
      locationLon: 15.645,
      pricePerHour: 50,
      yearsOfExperience: 9,
      serviceRadiusKm: 30,
      categories: ['ELECTRICAL'],
      bio: 'Certified electrical contractor.',
      profilePictureUrl: null,
      status: 'ACTIVE',
      emailVerified: true,
      createdAt: '2026-08-20T08:00:00Z',
      bankAccountHolder: 'Metka Horvat s.p.',
      bankIban: 'DE89370400440532013000',
      bankBic: 'COBADEFFXXX',
      bankName: 'Commerzbank',
    },
    calendarBlocks: [
      {
        id: 'blk-avail-wed',
        startAt: dayIso(2, '09:00'),
        endAt: dayIso(2, '10:00'),
        type: 'AVAILABLE',
        title: null,
        notes: null,
        ticketId: null,
        seriesId: null,
      },
    ],
    connectStatus: {
      connected: false,
      chargesEnabled: false,
      payoutsEnabled: false,
    },
    users: [
      {
        id: 'usr-admin-001',
        email: 'admin@fixitnow.si',
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        status: 'ACTIVE',
        profilePictureUrl: null,
        emailVerified: true,
        twoFactorEnabled: false,
        createdAt: '2026-09-01T08:00:00Z',
      },
      {
        id: 'usr-jane-002',
        email: 'jane.doe@mail.si',
        firstName: 'Jane',
        lastName: 'Doe',
        role: 'CUSTOMER',
        status: 'ACTIVE',
        profilePictureUrl: null,
        emailVerified: true,
        twoFactorEnabled: false,
        createdAt: '2026-09-12T08:00:00Z',
      },
      {
        id: 'usr-marko-003',
        email: 'marko.kovac@mail.si',
        firstName: 'Marko',
        lastName: 'Kovač',
        role: 'CUSTOMER',
        status: 'ACTIVE',
        profilePictureUrl: null,
        emailVerified: true,
        twoFactorEnabled: false,
        createdAt: '2026-09-14T08:00:00Z',
      },
    ],
    tickets: [
      {
        id: 21,
        serviceType: 'Pipe leak repair',
        category: 'PLUMBING',
        description: 'Kitchen sink pipe leaking.',
        priority: 'MEDIUM',
        status: 'PENDING_APPROVAL',
        location: 'Smetanova ulica 17, Maribor',
        latitude: 46.559,
        longitude: 15.638,
        createdAt: '2026-10-20T09:00:00Z',
        estimatedCost: null,
        submittedById: 'usr-marko-003',
        submittedByName: 'Marko Kovač',
        assignedServiceProviderId: 'prov-jane-001',
        assignedServiceProviderName: 'Jane Doe',
        statusHistory: [{ status: 'PENDING_APPROVAL', changedAt: '2026-10-20T09:00:00Z' }],
      },
      {
        id: 31,
        serviceType: 'Main breaker replacement',
        category: 'ELECTRICAL',
        description: 'Replaced main electrical panel.',
        priority: 'HIGH',
        status: 'COMPLETED',
        location: 'Koroška cesta 10, Maribor',
        latitude: 46.557,
        longitude: 15.642,
        createdAt: '2026-10-15T10:00:00Z',
        estimatedCost: 120,
        submittedById: 'usr-marko-003',
        submittedByName: 'Marko Kovač',
        assignedServiceProviderId: 'prov-metka-002',
        assignedServiceProviderName: 'Metka Horvat',
        statusHistory: [{ status: 'COMPLETED', changedAt: '2026-10-16T14:00:00Z' }],
      },
      {
        id: 32,
        serviceType: 'LED lighting installation',
        category: 'ELECTRICAL',
        description: 'Installed hallway LED strips.',
        priority: 'LOW',
        status: 'COMPLETED',
        location: 'Partizanska cesta 5, Maribor',
        latitude: 46.558,
        longitude: 15.649,
        createdAt: '2026-10-18T11:00:00Z',
        estimatedCost: 85,
        submittedById: 'usr-marko-003',
        submittedByName: 'Marko Kovač',
        assignedServiceProviderId: 'prov-metka-002',
        assignedServiceProviderName: 'Metka Horvat',
        statusHistory: [{ status: 'COMPLETED', changedAt: '2026-10-19T12:00:00Z' }],
      },
      {
        id: 33,
        serviceType: 'Outlet diagnostics',
        category: 'ELECTRICAL',
        description: 'Check living room outlets.',
        priority: 'MEDIUM',
        status: 'PENDING_PAYMENT',
        location: 'Gosposvetska cesta 22, Maribor',
        latitude: 46.561,
        longitude: 15.639,
        createdAt: '2026-10-21T08:30:00Z',
        estimatedCost: 45,
        submittedById: 'usr-marko-003',
        submittedByName: 'Marko Kovač',
        assignedServiceProviderId: 'prov-metka-002',
        assignedServiceProviderName: 'Metka Horvat',
        statusHistory: [{ status: 'PENDING_PAYMENT', changedAt: '2026-10-21T10:00:00Z' }],
      },
    ],
    nextBlockSeq: 100,
    nextTicketSeq: 100,
  };
}

function addDaysToLocalIso(iso: string, days: number): string {
  const [datePart, timePart] = iso.split('T');
  const [y, m, d] = datePart.split('-').map(Number);
  const dt = new Date(y, m - 1, d + days);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${timePart}`;
}

export function setupMockApi(state: MockState) {
  // SockJS / WebSocket fallback (avoid connection-refused noise when backend is offline)
  cy.intercept('**/ws/**', { statusCode: 200, body: '' });
  cy.intercept('GET', '**/ws/info*', {
    statusCode: 200,
    body: { websocket: false, origins: ['*:*'], cookie_needed: false, entropy: 123456 },
  });

  // Notifications & unread count
  cy.intercept('GET', '/api/notifications*', { statusCode: 200, body: [] });
  cy.intercept('GET', '/api/notifications/unread-count', { statusCode: 200, body: { count: 0 } });

  // Auth login (used in TS-09 to verify suspended / deleted user login rejection)
  cy.intercept('POST', '/api/v1/auth/login', (req) => {
    const email = (req.body?.email ?? '').toLowerCase();
    const user = state.users.find((u) => u.email.toLowerCase() === email);
    if (!user || user.status === 'DELETED') {
      req.reply({ statusCode: 401, body: { status: 401, message: 'Invalid email or password.' } });
      return;
    }
    if (user.status === 'SUSPENDED') {
      req.reply({
        statusCode: 403,
        body: { status: 403, message: 'Your account has been suspended. Please contact support.' },
      });
      return;
    }
    req.reply({
      statusCode: 200,
      body: {
        accessToken: makeFakeJwt(user.email, user.role, user.firstName, user.lastName),
        refreshToken: 'mock-refresh-token',
        role: user.role,
        twoFactorRequired: false,
      },
    });
  });

  // Current user profile
  cy.intercept('GET', '/api/v1/users/me', (req) => {
    if (state.currentActor === 'ADMIN') {
      req.reply({ statusCode: 200, body: state.users[0] });
    } else if (state.currentActor === 'CUSTOMER_A' || state.currentActor === 'CUSTOMER_B') {
      req.reply({ statusCode: 200, body: state.users[2] });
    } else if (state.currentActor === 'METKA_PROVIDER') {
      req.reply({ statusCode: 200, body: state.providerMetka });
    } else {
      req.reply({ statusCode: 200, body: state.providerJane });
    }
  });

  // Provider own profile & update (TS-07, TS-08)
  cy.intercept('GET', '/api/v1/providers/me', (req) => {
    const prov = state.currentActor === 'METKA_PROVIDER' ? state.providerMetka : state.providerJane;
    req.reply({ statusCode: 200, body: prov });
  });

  cy.intercept('PATCH', '/api/v1/providers/me', (req) => {
    const prov = state.currentActor === 'METKA_PROVIDER' ? state.providerMetka : state.providerJane;
    Object.assign(prov, req.body);
    req.reply({ statusCode: 200, body: prov });
  }).as('updateProvider');

  // Stripe Connect status & onboarding (TS-08)
  cy.intercept('GET', '/api/connect/status', (req) => {
    req.reply({ statusCode: 200, body: state.connectStatus });
  });

  cy.intercept('POST', '/api/connect/onboarding-link', (req) => {
    state.connectStatus = { connected: true, chargesEnabled: true, payoutsEnabled: true };
    req.reply({ statusCode: 200, body: { url: '/profile/edit?connect=done' } });
  }).as('connectOnboarding');

  cy.intercept('POST', '/api/connect/refresh', (req) => {
    req.reply({ statusCode: 200, body: state.connectStatus });
  });

  // Provider own calendar (TS-07)
  cy.intercept('GET', '/api/v1/providers/me/calendar*', (req) => {
    req.reply({ statusCode: 200, body: state.calendarBlocks });
  }).as('getOwnCalendar');

  cy.intercept('POST', '/api/v1/providers/me/calendar/blocks', (req) => {
    const { startAt, endAt, type, title, notes, recurrence } = req.body;
    const count = recurrence?.count ?? 1;
    const stepDays = recurrence?.frequency === 'DAILY' ? 1 : 7;
    const seriesId = count > 1 ? `series-${state.nextBlockSeq}` : null;
    const created: MockTimeBlock[] = [];
    const skipped: string[] = [];

    for (let i = 0; i < count; i++) {
      const s = i === 0 ? startAt : addDaysToLocalIso(startAt, i * stepDays);
      const e = i === 0 ? endAt : addDaysToLocalIso(endAt, i * stepDays);
      const overlaps = state.calendarBlocks.some((b) => s < b.endAt && e > b.startAt);
      if (overlaps) {
        skipped.push(s);
        continue;
      }
      const blk: MockTimeBlock = {
        id: `blk-${state.nextBlockSeq++}`,
        startAt: s,
        endAt: e,
        type,
        title: title ?? null,
        notes: notes ?? null,
        ticketId: null,
        seriesId,
      };
      state.calendarBlocks.push(blk);
      created.push(blk);
    }
    req.reply({ statusCode: 201, body: { created, skipped } });
  }).as('createTimeBlock');

  cy.intercept('PUT', '/api/v1/providers/me/calendar/blocks/*', (req) => {
    const id = req.url.split('/').pop()!;
    const blk = state.calendarBlocks.find((b) => b.id === id);
    if (!blk) {
      req.reply({ statusCode: 404, body: { message: 'Block not found' } });
      return;
    }
    Object.assign(blk, req.body);
    req.reply({ statusCode: 200, body: blk });
  }).as('updateTimeBlock');

  cy.intercept('DELETE', '/api/v1/providers/me/calendar/blocks/series/*', (req) => {
    const seriesId = req.url.split('/').pop()!;
    state.calendarBlocks = state.calendarBlocks.filter((b) => b.seriesId !== seriesId);
    req.reply({ statusCode: 200, body: { message: 'Series deleted' } });
  }).as('deleteTimeBlockSeries');

  cy.intercept('DELETE', /\/api\/v1\/providers\/me\/calendar\/blocks\/(?!series\/)[^/]+$/, (req) => {
    const id = req.url.split('/').pop()!;
    state.calendarBlocks = state.calendarBlocks.filter((b) => b.id !== id);
    req.reply({ statusCode: 200, body: { message: 'Block deleted' } });
  }).as('deleteTimeBlock');

  // Public provider profile & calendar (TS-07 collision check)
  cy.intercept('GET', /\/api\/v1\/providers\/prov-[^/]+\/calendar/, (req) => {
    const pub = state.calendarBlocks.map((b) => ({
      startAt: b.startAt,
      endAt: b.endAt,
      type: b.type,
      label: b.type === 'AVAILABLE' ? 'Available' : 'Busy',
    }));
    req.reply({ statusCode: 200, body: pub });
  }).as('getPublicCalendar');

  cy.intercept('GET', /\/api\/v1\/providers\/prov-[^/?]+$/, (req) => {
    req.reply({ statusCode: 200, body: state.providerJane });
  });

  cy.intercept('GET', '/api/v1/reviews/provider/*', { statusCode: 200, body: [] });

  // Provider tickets & payouts (TS-07, TS-08)
  cy.intercept('GET', '/api/tickets/provider', (req) => {
    const provId =
      state.currentActor === 'METKA_PROVIDER' ? 'prov-metka-002' : 'prov-jane-001';
    const list = state.tickets.filter((t) => t.assignedServiceProviderId === provId);
    req.reply({ statusCode: 200, body: list });
  }).as('getProviderTickets');

  // Customer tickets + booking collision check (TS-07)
  cy.intercept('GET', '/api/tickets', (req) => {
    req.reply({ statusCode: 200, body: state.tickets });
  });

  cy.intercept('POST', '/api/tickets', (req) => {
    const { scheduledAt, scheduledEndAt } = req.body;
    const availBlock = state.calendarBlocks.find(
      (b) => b.type === 'AVAILABLE' && b.startAt === scheduledAt && b.endAt === scheduledEndAt,
    );
    if (scheduledAt && !availBlock) {
      req.reply({
        statusCode: 409,
        body: { status: 409, message: 'Selected time slot is no longer available.' },
      });
      return;
    }
    const newId = state.nextTicketSeq++;
    if (availBlock) {
      availBlock.type = 'BOOKED';
      availBlock.ticketId = newId;
      availBlock.title = req.body.serviceType ?? 'Booked service';
    }
    const tk: MockTicket = {
      id: newId,
      serviceType: req.body.serviceType ?? 'Plumbing booking',
      category: req.body.category ?? 'PLUMBING',
      description: req.body.description ?? '',
      priority: req.body.priority ?? 'MEDIUM',
      status: 'PENDING_APPROVAL',
      location: req.body.location ?? 'Maribor',
      latitude: req.body.latitude ?? 46.559,
      longitude: req.body.longitude ?? 15.638,
      createdAt: new Date().toISOString(),
      scheduledAt: scheduledAt ?? null,
      scheduledEndAt: scheduledEndAt ?? null,
      submittedById: 'usr-marko-003',
      submittedByName: 'Marko Kovač',
      assignedServiceProviderId: 'prov-jane-001',
      assignedServiceProviderName: 'Jane Doe',
    };
    state.tickets.push(tk);
    req.reply({ statusCode: 201, body: tk });
  }).as('createTicket');

  cy.intercept('PUT', /\/api\/tickets\/\d+\/(cancel|decline)/, (req) => {
    const parts = req.url.split('/');
    const id = Number(parts[parts.length - 2]);
    const tk = state.tickets.find((t) => t.id === id);
    if (tk) {
      tk.status = 'CANCELLED';
      const blk = state.calendarBlocks.find((b) => b.ticketId === id);
      if (blk) {
        blk.type = 'AVAILABLE';
        blk.ticketId = null;
        blk.title = null;
      }
    }
    req.reply({ statusCode: 200, body: tk ?? {} });
  }).as('cancelTicket');

  // Admin endpoints (TS-09)
  cy.intercept('GET', '/api/v1/admin/providers/pending', { statusCode: 200, body: [] });

  cy.intercept('GET', '/api/v1/admin/users', (req) => {
    req.reply({ statusCode: 200, body: state.users });
  }).as('getAdminUsers');

  cy.intercept('PUT', /\/api\/v1\/admin\/users\/[^/]+\/role/, (req) => {
    const parts = req.url.split('/');
    const id = parts[parts.length - 2];
    const user = state.users.find((u) => u.id === id);
    if (user) user.role = req.body.role;
    req.reply({ statusCode: 200, body: { message: `Role updated to ${req.body.role}` } });
  }).as('changeUserRole');

  cy.intercept('POST', /\/api\/v1\/admin\/users\/[^/]+\/suspend/, (req) => {
    const parts = req.url.split('/');
    const id = parts[parts.length - 2];
    const user = state.users.find((u) => u.id === id);
    if (user) user.status = 'SUSPENDED';
    req.reply({ statusCode: 200, body: { message: 'User suspended.' } });
  }).as('suspendUser');

  cy.intercept('POST', /\/api\/v1\/admin\/users\/[^/]+\/reactivate/, (req) => {
    const parts = req.url.split('/');
    const id = parts[parts.length - 2];
    const user = state.users.find((u) => u.id === id);
    if (user) user.status = 'ACTIVE';
    req.reply({ statusCode: 200, body: { message: 'User reactivated.' } });
  }).as('reactivateUser');

  cy.intercept('DELETE', /\/api\/v1\/admin\/users\/[^/]+$/, (req) => {
    const id = req.url.split('/').pop()!;
    const user = state.users.find((u) => u.id === id);
    if (user) user.status = 'DELETED';
    req.reply({ statusCode: 200, body: { message: 'User deleted.' } });
  }).as('deleteUser');

  cy.intercept('GET', '/api/v1/admin/tickets', (req) => {
    req.reply({ statusCode: 200, body: state.tickets });
  }).as('getAdminTickets');

  cy.intercept('PUT', /\/api\/v1\/admin\/tickets\/\d+/, (req) => {
    const id = Number(req.url.split('/').pop());
    const tk = state.tickets.find((t) => t.id === id);
    if (tk) {
      if (req.body.status) tk.status = req.body.status;
      if (req.body.priority) tk.priority = req.body.priority;
    }
    req.reply({ statusCode: 200, body: tk ?? {} });
  }).as('adminUpdateTicket');

  cy.intercept('DELETE', /\/api\/v1\/admin\/tickets\/\d+/, (req) => {
    const id = Number(req.url.split('/').pop());
    state.tickets = state.tickets.filter((t) => t.id !== id);
    req.reply({ statusCode: 200, body: { message: 'Ticket deleted.' } });
  }).as('adminDeleteTicket');
}
