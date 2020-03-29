require('dotenv').config()
const app = require('../src/app');

describe('App', () => {
  const token = process.env.API_TOKEN
  it('GET / responds with 401 without proper authorization', () => {
    return supertest(app)
      .get('/')
      .expect(401)
  })

  it('GET / responds with 200 containing "Hello, Paul!" with proper authorization token', () => {
    return supertest(app)
      .get('/')
      .set('Authorization', 'Bearer ' + token)
      .expect(200, 'Hello, Paul!');
  });
});