import { createInitialMockState, setSessionInWindow, setupMockApi } from '../support/mockApi';

describe('TS-09: Skrbniška nadzorna plošča — vloge, suspenz/reaktivacija in zahtevki', () => {
  it('upravlja vloge, suspenz in reaktivacijo uporabnika ter posodobi in izbriše zahtevek', () => {
    const state = createInitialMockState();
    state.currentActor = 'ADMIN';
    setupMockApi(state);

    // Korak 1 & 2: Prijava kot Admin na /dashboard/admin/users ter sprememba vloge Jane Doe (CUSTOMER -> ADMIN -> CUSTOMER)
    cy.visit('/dashboard/admin/users', {
      onBeforeLoad(win) {
        setSessionInWindow(win, {
          email: 'admin@fixitnow.si',
          role: 'ADMIN',
          firstName: 'Admin',
          lastName: 'User',
        });
      },
    });
    cy.wait('@getAdminUsers');
    cy.contains('.admin-table-row', 'jane.doe@mail.si').within(() => {
      cy.get('select').select('ADMIN');
    });
    cy.wait('@changeUserRole').its('request.body.role').should('eq', 'ADMIN');

    cy.contains('.admin-table-row', 'jane.doe@mail.si').within(() => {
      cy.get('select').select('CUSTOMER');
    });
    cy.wait('@changeUserRole').its('request.body.role').should('eq', 'CUSTOMER');

    // Korak 3: Suspenz uporabnice Jane Doe in preverjanje zavrnitve prijave na /login
    cy.contains('.admin-table-row', 'jane.doe@mail.si').within(() => {
      cy.contains('button', 'Suspend').click();
    });
    cy.wait('@suspendUser');
    cy.contains('.admin-table-row', 'jane.doe@mail.si').contains('SUSPENDED').should('be.visible');
    cy.screenshot('ts09-admin-users-suspended');

    cy.visit('/login', {
      onBeforeLoad(win) {
        win.localStorage.removeItem('frontend.auth.session');
        win.localStorage.removeItem('frontend.auth.persistent');
        win.localStorage.setItem('i18nextLng', 'en');
      },
    });
    cy.get('input[type="email"]').type('jane.doe@mail.si');
    cy.get('input[type="password"]').type('Password1!');
    cy.get('button[type="submit"]').click();
    cy.contains('Your account has been suspended. Please contact support.').should('be.visible');

    // Korak 4: Reaktivacija uporabnice Jane Doe
    cy.visit('/dashboard/admin/users', {
      onBeforeLoad(win) {
        setSessionInWindow(win, {
          email: 'admin@fixitnow.si',
          role: 'ADMIN',
          firstName: 'Admin',
          lastName: 'User',
        });
      },
    });
    cy.wait('@getAdminUsers');
    cy.contains('.admin-table-row', 'jane.doe@mail.si').within(() => {
      cy.contains('button', 'Reactivate').click();
    });
    cy.wait('@reactivateUser');
    cy.contains('.admin-table-row', 'jane.doe@mail.si').contains('ACTIVE').should('be.visible');

    // Korak 5-7: Skrbniški seznam zahtevkov — sprememba statusa, prioritete in izbris FIX-0021
    cy.visit('/dashboard/admin/tickets', {
      onBeforeLoad(win) {
        setSessionInWindow(win, {
          email: 'admin@fixitnow.si',
          role: 'ADMIN',
          firstName: 'Admin',
          lastName: 'User',
        });
      },
    });
    cy.wait('@getAdminTickets');
    cy.contains('.admin-table-row', 'FIX-0021').within(() => {
      cy.get('select').eq(0).select('COMPLETED');
    });
    cy.wait('@adminUpdateTicket').its('request.body.status').should('eq', 'COMPLETED');

    cy.contains('.admin-table-row', 'FIX-0021').within(() => {
      cy.get('select').eq(1).select('CRITICAL');
    });
    cy.wait('@adminUpdateTicket').its('request.body.priority').should('eq', 'CRITICAL');
    cy.screenshot('ts09-admin-tickets-updated');

    cy.contains('.admin-table-row', 'FIX-0021').within(() => {
      cy.contains('button', 'Delete').click();
    });
    cy.contains('button', 'Delete ticket').click();
    cy.wait('@adminDeleteTicket');
    cy.contains('.admin-table-row', 'FIX-0021').should('not.exist');

    // Korak 8: Izbris testnega uporabnika Jane Doe
    cy.visit('/dashboard/admin/users', {
      onBeforeLoad(win) {
        setSessionInWindow(win, {
          email: 'admin@fixitnow.si',
          role: 'ADMIN',
          firstName: 'Admin',
          lastName: 'User',
        });
      },
    });
    cy.wait('@getAdminUsers');
    cy.contains('.admin-table-row', 'jane.doe@mail.si').within(() => {
      cy.contains('button', 'Delete').click();
    });
    cy.contains('button', 'Delete user').click();
    cy.wait('@deleteUser');
    cy.contains('.admin-table-row', 'jane.doe@mail.si').contains('DELETED').should('be.visible');
  });
});
