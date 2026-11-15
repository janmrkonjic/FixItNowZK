import { createInitialMockState, setSessionInWindow, setupMockApi } from '../support/mockApi';

describe('TS-08: Bančni podatki izvajalca (IBAN MOD-97), Stripe in pregled izplačil', () => {
  it('zavrne neveljaven IBAN, shrani veljavnega, poveže Stripe ter preveri prazna in neprazna izplačila', () => {
    const state = createInitialMockState();
    setupMockApi(state);

    // Korak 1: Prijava kot Jane Doe (brez IBAN-a) na /profile/edit
    cy.visit('/profile/edit', {
      onBeforeLoad(win) {
        setSessionInWindow(win, {
          email: 'jane.doe@fixitnow.si',
          role: 'PROVIDER',
          firstName: 'Jane',
          lastName: 'Doe',
        });
      },
    });

    // Vnos neveljavnega IBAN-a (napačna kontrolna vsota MOD-97)
    cy.get('#p-bank-iban').should('be.visible').clear().type('DE89370400440532013001');
    cy.contains('button[type="submit"]', 'Save').click();
    cy.contains('Invalid IBAN').should('be.visible');
    cy.get('#p-bank-iban').scrollIntoView({ offset: { top: -220, left: 0 } });
    cy.screenshot('ts08-iban-validation-error', { capture: 'viewport' });

    // Korak 2: Vnos veljavnega IBAN-a in shranjevanje
    cy.get('#p-bank-iban').clear().type('DE89370400440532013000');
    cy.get('#p-bank-bic').clear().type('COBADEFFXXX');
    cy.get('#p-bank-name').clear().type('Commerzbank');
    cy.contains('button[type="submit"]', 'Save').click();
    cy.wait('@updateProvider').its('request.body.bankIban').should('eq', 'DE89370400440532013000');

    // Korak 3: Povezava Stripe payouts
    cy.contains('button', 'Set up Stripe payouts').click();
    cy.wait('@connectOnboarding');
    cy.contains('Active').should('be.visible');

    // Korak 4: Pregled praznega seznama izplačil za Jane Doe
    cy.visit('/dashboard/provider/payouts', {
      onBeforeLoad(win) {
        setSessionInWindow(win, {
          email: 'jane.doe@fixitnow.si',
          role: 'PROVIDER',
          firstName: 'Jane',
          lastName: 'Doe',
        });
      },
    });
    cy.wait('@getProviderTickets');
    cy.contains('No payouts yet').should('be.visible');

    // Korak 5 & 6: Pregled zaslužkov in izplačil za Metko Horvat (2 Completed = €205.00, 1 Pending = €45.00)
    cy.then(() => {
      state.currentActor = 'METKA_PROVIDER';
    });
    cy.visit('/dashboard/provider/payouts', {
      onBeforeLoad(win) {
        setSessionInWindow(win, {
          email: 'metka.horvat@fixitnow.si',
          role: 'PROVIDER',
          firstName: 'Metka',
          lastName: 'Horvat',
        });
      },
    });
    cy.wait('@getProviderTickets');
    cy.contains('€205.00').should('be.visible');
    cy.contains('€45.00').should('be.visible');
    cy.contains('FIX-0031').should('be.visible');
    cy.contains('FIX-0032').should('be.visible');
    cy.contains('FIX-0033').should('be.visible');
    cy.screenshot('ts08-payouts-metka');
  });
});
