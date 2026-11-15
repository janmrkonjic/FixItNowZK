import { createInitialMockState, setSessionInWindow, setupMockApi } from '../support/mockApi';

describe('TS-07: Upravljanje koledarja izvajalca in preverjanje kolizij', () => {
  it('ustvari, uredi in izbriše bloke ter prepreči dvojno rezervacijo termina', () => {
    const state = createInitialMockState();
    setupMockApi(state);

    const now = new Date();
    const monday = new Date(now);
    const day = monday.getDay();
    monday.setDate(monday.getDate() + (day === 0 ? -6 : 1 - day));
    const pad = (n: number) => String(n).padStart(2, '0');
    const dateStr = (offsetDays: number) => {
      const d = new Date(monday);
      d.setDate(d.getDate() + offsetDays);
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    };

    const tue = dateStr(1);
    const wed = dateStr(2);
    const thu = dateStr(3);

    // Korak 1: Prijava kot izvajalka Jane Doe in odpiranje Schedule na /profile
    cy.visit('/profile', {
      onBeforeLoad(win) {
        setSessionInWindow(win, {
          email: 'jane.doe@fixitnow.si',
          role: 'PROVIDER',
          firstName: 'Jane',
          lastName: 'Doe',
        });
      },
    });

    cy.contains('[role="tab"]', 'Schedule').click();
    cy.wait('@getOwnCalendar');
    cy.get('.fc-week-calendar').should('be.visible');

    // Korak 2: Ustvari enkratni blok BREAK (torek 10:00-11:00) in osveži stran
    cy.contains('button', '+ Create').click();
    cy.get('.block-time-modal').within(() => {
      cy.get('select').first().select('BREAK');
      cy.get('input[type="datetime-local"]').eq(0).clear().type(`${tue}T10:00`);
      cy.get('input[type="datetime-local"]').eq(1).clear().type(`${tue}T11:00`);
      cy.contains('button[type="submit"]', 'Add').click();
    });
    cy.wait('@createTimeBlock');
    cy.contains('.fc-event', 'Break').should('be.visible');

    cy.reload();
    cy.contains('[role="tab"]', 'Schedule').click();
    cy.contains('.fc-event', 'Break').should('be.visible');

    // Korak 3: Ustvari dnevno serijo BREAK (sre-pet, 12:00-13:00, 3 pojavitve)
    cy.contains('button', '+ Create').click();
    cy.get('.block-time-modal').within(() => {
      cy.get('select').first().select('BREAK');
      cy.get('input[type="datetime-local"]').eq(0).clear().type(`${wed}T12:00`);
      cy.get('input[type="datetime-local"]').eq(1).clear().type(`${wed}T13:00`);
      cy.get('input[type="checkbox"]').check();
      cy.get('select').eq(1).select('DAILY');
      cy.get('input[type="number"]').should('have.value', '3');
      cy.contains('button[type="submit"]', 'Add').click();
    });
    cy.wait('@createTimeBlock');
    cy.get('.fc-event').filter(':contains("Break")').should('have.length', 4);

    // Korak 4: Ustvari tedensko serijo OFF (četrtek, 15:00-16:00, 3 tedne)
    cy.contains('button', '+ Create').click();
    cy.get('.block-time-modal').within(() => {
      cy.get('select').first().select('OFF');
      cy.get('input[type="datetime-local"]').eq(0).clear().type(`${thu}T15:00`);
      cy.get('input[type="datetime-local"]').eq(1).clear().type(`${thu}T16:00`);
      cy.get('input[type="checkbox"]').check();
      cy.get('select').eq(1).select('WEEKLY');
      cy.get('input[type="number"]').should('have.value', '3');
      cy.contains('button[type="submit"]', 'Add').click();
    });
    cy.wait('@createTimeBlock');
    cy.contains('.fc-event', 'Off').should('be.visible');

    // Posnetek koledarja z enkratnim in ponavljajočimi se bloki
    cy.screenshot('ts07-provider-calendar');

    // Korak 5 & 6: Uredi enkratni blok (Break -> Off 11:00-12:00), nato ga izbriši
    cy.contains('.fc-event', '10:00–11:00').click();
    cy.get('.block-time-modal').within(() => {
      cy.get('select').first().select('OFF');
      cy.get('input[type="datetime-local"]').eq(0).clear().type(`${tue}T11:00`);
      cy.get('input[type="datetime-local"]').eq(1).clear().type(`${tue}T12:00`);
      cy.contains('button[type="submit"]', 'Save').click();
    });
    cy.wait('@updateTimeBlock');
    cy.contains('.fc-event', '11:00–12:00').should('be.visible').click();
    cy.get('.block-time-modal').within(() => {
      cy.contains('button', 'Delete').click();
    });
    cy.wait('@deleteTimeBlock');
    cy.get('.fc-event').filter(':contains("Break")').should('have.length', 3);

    // Korak 7-9: Preverjanje kolizije rezervacije (Stranka A rezervira 09:00-10:00, Stranka B je zavrnjena, po preklicu spet prosto)
    const slotStart = `${wed}T09:00:00`;
    const slotEnd = `${wed}T10:00:00`;

    cy.window().then(async (win) => {
      // Stranka A ustvari rezervacijo za prosti termin
      const resA = await win.fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceType: 'Sink repair',
          category: 'PLUMBING',
          scheduledAt: slotStart,
          scheduledEndAt: slotEnd,
        }),
      });
      expect(resA.status).to.eq(201);
      const createdTicket = await resA.json();

      // Stranka B poskuša rezervirati isti termin -> 409 Conflict (preprečitev dvojne rezervacije)
      const resB = await win.fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceType: 'Duplicate booking',
          category: 'PLUMBING',
          scheduledAt: slotStart,
          scheduledEndAt: slotEnd,
        }),
      });
      expect(resB.status).to.eq(409);

      // Izvajalec prekliče zahtevek Stranke A -> termin je ponovno razpoložljiv za Stranko B
      const resCancel = await win.fetch(`/api/tickets/${createdTicket.id}/cancel`, {
        method: 'PUT',
      });
      expect(resCancel.status).to.eq(200);

      const resB2 = await win.fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceType: 'Rebooked slot',
          category: 'PLUMBING',
          scheduledAt: slotStart,
          scheduledEndAt: slotEnd,
        }),
      });
      expect(resB2.status).to.eq(201);
    });
  });
});
