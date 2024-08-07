const generateEmail = (): string => `test.user${Date.now()}@email.com`;
const generatePassword = (): string => `ValidPassword123!${Date.now()}`;

describe('User Registration and Authentication', () => {
  const navigateToPricingAndStartFreeTrial = (): void => {
    cy.visit('https://nativeteams.com/pricing');
    cy.contains('Start FREE').click();
    cy.contains('label', 'Free').click();
    cy.contains('button', 'Next').click();
  };

  const fillUserDetails = (email: string, password: string): void => {
    cy.get('input[placeholder="Enter your first name"]').type('John');
    cy.get('input[placeholder="Enter your last name"]').type('Doe');
    cy.get('input[placeholder="Enter your email address"]').type(email);
    cy.get('input[placeholder="Enter your password"]').type(password);
    cy.contains('button', 'Next').click();
  };

  beforeEach(() => {
    cy.intercept('POST', '/api/register').as('register');
    cy.intercept('POST', '/api/login').as('login');
    cy.intercept('GET', '/api/profile').as('getProfile');
    cy.intercept('PUT', '/api/profile').as('updateProfile');
  });

  it('should register a user with valid data', () => {
    const email = generateEmail();
    const password = generatePassword();

    navigateToPricingAndStartFreeTrial();
    fillUserDetails(email, password);

    cy.get('input[placeholder="Select"]').eq(0).click();
    cy.contains('div', 'Armenia').click();
    cy.get('input[placeholder="77123456"]').type('12345678');

    cy.get('input[placeholder="Select"]').first().click();
    cy.get('[id="An employee"]').click();
    cy.get('body').type('{esc}');

    cy.get('input[placeholder="Select"]').eq(1).click();
    cy.get('[id="Legal employment (EOR services)"]').click();
    cy.get('body').type('{esc}');

    cy.get('input[placeholder="Select"]').eq(2).click();
    cy.get('[id="Upwork"]').click();
    cy.get('body').type('{esc}');

    cy.get('input[placeholder="Select"]').eq(3).click();
    cy.get('[id="Revolut"]').click();
    cy.get('body').type('{esc}');

    cy.get('input[type="checkbox"]').first().click();
    cy.contains('button', 'Create your account').click();

    cy.contains('Thank you for signing up!').should('be.visible');
  });

  it('should show error message for invalid email', () => {
    navigateToPricingAndStartFreeTrial();

    cy.get('input[placeholder="Enter your email address"]').type('invalid-email');
    cy.contains('The email must be a valid email address').should('be.visible');
  });

  it('should show password requirements', () => {
    navigateToPricingAndStartFreeTrial();

    cy.get('input[placeholder="Enter your password"]').focus();
    cy.contains('Your password must contain:').should('be.visible');
    cy.contains('8 characters minimum, no whitespaces').should('be.visible');
    cy.contains('At least one number').should('be.visible');
    cy.contains('At least one uppercase letter').should('be.visible');
    cy.contains('At least one special character (e.g. @$!%*?^)').should('be.visible');
  });
});

describe('Login Functionality', () => {
  it('should log in with valid credentials', () => {
    const email = generateEmail();
    const password = generatePassword();

    cy.visit('https://nativeteams.com/login');
    cy.get('input[placeholder="Type here"]').eq(0).type(email);
    cy.get('input[placeholder="Type here"]').eq(1).type(password);
    cy.get('button[type="button"]').click();

    cy.url().should('include', 'app.nativeteams.com');
  });

  it('should not log in with invalid credentials', () => {
    const email = generateEmail();

    cy.visit('https://nativeteams.com/login');
    cy.get('input[placeholder="Type here"]').eq(0).type(email);
    cy.get('input[placeholder="Type here"]').eq(1).type('InvalidPassword!');
    cy.get('button[type="button"]').first().click();

    cy.contains('Please provide valid email address and password.').should('be.visible');
  });
});

describe('Profile Update', () => {
  const email = generateEmail();
  const password = generatePassword();

  beforeEach(() => {
    cy.login(email, password);
    cy.intercept('GET', '/api/profile').as('getProfile');
    cy.intercept('PUT', '/api/profile').as('updateProfile');
  });

  it('should update profile information', () => {
    cy.visit('https://app.nativeteams.com/settings?tab=profile');

    cy.get('div[name="email"] input[placeholder="Type here"]').clear().type(email);
    cy.get('input[id="birth_date"]').clear().type('1990-01-01');
    cy.get('div[name="phone"] input[placeholder="77123456"]').clear().type('123456789');
    cy.get('input[placeholder="Type here"]').eq(2).clear().type('Yerevan'); 
    cy.get('input[placeholder="Type here"]').eq(3).clear().type('123 Main St');

    cy.get('div[name="country"] button').click();
    cy.contains('Armenia').click();

    cy.get('button[type="button"]').contains('Save edits').click();

    cy.wait('@updateProfile').its('response.statusCode').should('eq', 200);
    cy.contains('Profile updated successfully').should('be.visible');
  });

  it('should reflect changes after profile update', () => {
    cy.visit('https://app.nativeteams.com/settings?tab=profile');

    cy.wait('@getProfile').then(() => {
      cy.get('div[name="email"] input[placeholder="Type here"]').should('have.value', email);
      cy.get('input[id="birth_date"]').should('have.value', '1990-01-01');
      cy.get('div[name="phone"] input[placeholder="77123456"]').should('have.value', '123456789');
      cy.get('input[placeholder="Type here"]').eq(2).should('have.value', 'Yerevan');
      cy.get('input[placeholder="Type here"]').eq(3).should('have.value', '123 Main St');
      cy.get('div[name="country"] button').should('contain', 'Armenia');
    });
  });
});

describe('Navigation Functionality', () => {
  const email = generateEmail();
  const password = generatePassword();

  beforeEach(() => {
    cy.login(email, password);
  });

  it('should navigate to Settings', () => {
    cy.visit('https://app.nativeteams.com/');
    cy.get('[type="button"]').eq(1).click();
    cy.get('[class="content-container"]').should('be.visible');
    cy.contains('Settings').click();
    cy.contains('Bank accounts').should('be.visible');
    cy.url().should('include', '/settings?tab=payment_accounts');
  });

  it('should navigate to Wallet', () => {
    cy.visit('https://app.nativeteams.com/');
    cy.get('[type="button"]').eq(1).click();
    cy.get('[class="content-container"]').should('be.visible');
    cy.contains('My documents').click();
    cy.url().should('include', '/documents');
  });

  it('should navigate to Documents', () => {
    cy.visit('https://app.nativeteams.com/');
    cy.get('[type="button"]').eq(1).click();
    cy.get('[class="content-container"]').should('be.visible');
    cy.contains('Knowledge base').click();
    cy.url().should('include', '/knowledge-base');
  });
});
