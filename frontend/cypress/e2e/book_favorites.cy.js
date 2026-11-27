describe('Book Favorites App', () => {
  // generate a random username and password for the e2e tests
  const username = `e2euser${Math.floor(Math.random() * 1000)}`;
  const password = `e2epass${Math.floor(Math.random() * 1000)}`;
  const user = { username, password };

  beforeEach(() => {
    cy.visit('http://localhost:5173');
  });

  it('should allow a new user to register and login', () => {
    cy.contains('Create Account').click();
    cy.get('input[name="username"]').type(user.username);
    cy.get('input[name="password"]').type(user.password);
    cy.get('button#register').click();
    cy.contains('Registration successful! You can now log in.').should('exist');
    // wait for a bit to ensure the success message is visible
    cy.wait(2000);
    cy.get('input[name="username"]').type(user.username);
    cy.get('input[name="password"]').type(user.password);
    cy.get('button#login').click();
    cy.contains(`Hi, ${user.username}`).should('exist');
    cy.contains('Favorites').should('exist');
  });

  it('should show books and allow adding to favorites', () => {
    // Login first
    cy.contains('Login').click();
    cy.get('input[name="username"]').type(user.username);
    cy.get('input[name="password"]').type(user.password);
    cy.get('button#login').click();
    cy.contains('Books').click();
    cy.contains('h2', 'Books').should('exist');
    cy.get('button').contains('Add to Favorites').first().click();
    cy.get('a#favorites-link').click();
    cy.get('h2').contains('My Favorite Books').should('exist');
  });

  it('removes favorites from both views and keeps them after a failed request', () => {
    const removalUser = {
      username: `remove${Date.now()}${Math.floor(Math.random() * 10000)}`,
      password: 'removal-test-password',
    };
    cy.request('POST', 'http://localhost:4000/api/register', removalUser);
    cy.contains('Login').click();
    cy.get('input[name="username"]').type(removalUser.username);
    cy.get('input[name="password"]').type(removalUser.password);
    cy.get('button#login').click();
    cy.contains('Books').click();
    cy.intercept('POST', '**/api/favorites').as('addFavorite');
    cy.intercept('DELETE', '**/api/v1/favorites/*').as('removeFavorite');

    cy.contains('button', 'Add to Favorites').first().click();
    cy.wait('@addFavorite');
    cy.contains('button', 'Remove from Favorites').should('exist').click();
    cy.wait('@removeFavorite').its('response.statusCode').should('eq', 200);
    cy.contains('button', 'Remove from Favorites').should('not.exist');

    cy.contains('button', 'Add to Favorites').first().click();
    cy.wait('@addFavorite');
    cy.contains('button', 'Remove from Favorites').should('exist');
    cy.get('a#favorites-link').click();
    cy.contains('button', 'Remove from Favorites').should('exist');
    cy.intercept({ method: 'DELETE', url: '**/api/v1/favorites/*', times: 1 }, {
      statusCode: 500,
      body: { message: 'Removal failed' },
    }).as('failedRemoval');
    cy.contains('button', 'Remove from Favorites').click();
    cy.wait('@failedRemoval');
    cy.get('[role="alert"]').should('contain', 'Failed to remove favorite');
    cy.contains('button', 'Remove from Favorites').should('exist').click();
    cy.wait('@removeFavorite').its('response.statusCode').should('eq', 200);
    cy.contains('No favorite books yet.').should('exist');
    cy.reload();
    cy.contains('No favorite books yet.').should('exist');
  });

  it('should logout and protect routes', () => {
    // Login first
    cy.contains('Login').click();
    cy.get('input[name="username"]').type(user.username);
    cy.get('input[name="password"]').type(user.password);
    cy.get('button#login').click();
    cy.get('button#logout').click();
    cy.contains('Login').should('exist');
    cy.visit('http://localhost:5173/books');
    cy.url().should('eq', 'http://localhost:5173/');
  });
});
