Cypress.Commands.add('login', (email, password) => {
    cy.visit('https://nativeteams.com/login');
    cy.get('input[placeholder="Type here"]').eq(0).type(email);
    cy.get('input[placeholder="Type here"]').eq(1).type(password);
    cy.get('button[type="button"]').click();
  });