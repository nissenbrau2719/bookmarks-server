require('dotenv').config();
const knex = require('knex');
const app = require('../src/app');
const { makeBookmarksArray, makeMaliciousBookmark, makeSanitizedBookmark } = require('./bookmarks.fixtures');
const { PORT } = require('../src/config');

describe('Bookmarks Endpoints', function() {
  context('Given endpoint requests have proper authorization', () => {
    const token = process.env.API_TOKEN

    let db
    before('make knex instance', () => {
      db = knex({
        client: 'pg',
        connection: process.env.TEST_DB_URL
      })
      app.set('db', db)
    })

    before('clean up the table beforehand', () => db('bookmarks').truncate())

    after('disconnect from db', () => db.destroy())

    afterEach('clean up the table afterwards', () => db('bookmarks').truncate())

  
    
    describe(`GET /bookmarks`, () => {

      context(`Given there are no bookmarks saved`, () => {
        it(`responds with 200 and an empty list`, () => {
          return supertest(app)
            .get('/bookmarks')
            .set('Authorization', 'Bearer ' + token)
            .expect(200, [])
        })
      })

      context(`Given there are bookmarks saved`, () => {
        const testBookmarks = makeBookmarksArray()
        beforeEach('insert bookmarks', () => {
          return db
            .into('bookmarks')
            .insert(testBookmarks)
        })
      
        it(`responds with 200 and all of the bookmarks`, () => {
          return supertest(app)
            .get('/bookmarks')
            .set('Authorization', 'Bearer ' + token)
            .expect(200, testBookmarks)
        })
      })

      context(`Given one of the bookmarks in the database contains XSS attack`, () => {
        const maliciousBookmark = makeMaliciousBookmark()
        const expectedBookmark = makeSanitizedBookmark()

        beforeEach('insert the malicious bookmark', () => {
          return db
            .into('bookmarks')
            .insert(maliciousBookmark)
        })

        it('sanitizes any malicious content', () => {
          return supertest(app)
            .get('/bookmarks')
            .set('Authorization', 'Bearer ' + token)
            .expect(200)
            .expect(res => {
              expect(res.body[0].title).to.eql(expectedBookmark.title)
              expect(res.body[0].description).to.eql(expectedBookmark.description)
            })
        })
      })
    })

    describe(`GET /bookmarks/:id`, () => {
      context(`Given bookmark with provided 'id' doesn't exist`, () => {
        it('responds with 404', () => {
          const bookmarkId = 1234567890
          return supertest(app)
            .get(`/bookmarks/${bookmarkId}`)
            .set('Authorization', 'Bearer ' + token)
            .expect(404, { error: { message: 'Bookmark not found'}})
        })
      })

      context(`Given bookmark with provided 'id' is in the database`, () => {
        const testBookmarks = makeBookmarksArray()
        beforeEach('insert bookmarks', () => {
          return db
            .into('bookmarks')
            .insert(testBookmarks)
        })

        it(`responds with 200 and the specified bookmark`, () => {
          const bookmarkId = 2
          const expectedBookmark = testBookmarks.find(bookmark => bookmark.id === bookmarkId)
          return supertest(app)
            .get(`/bookmarks/${bookmarkId}`)
            .set('Authorization', 'Bearer ' + token)
            .expect(200, expectedBookmark)
        })
      })
    })

    describe(`POST /bookmarks`, () => {
      context('Given all required fields are filled out', () => {
        it('creates a bookmark with unique id, responding with 201 and the location', () => {
          const newBookmark = {
            title: 'Website name',
            url: 'www.website.com',
            rating: '1',
            description: 'Test bookmark'
          }
          return supertest(app)
            .post('/bookmarks')
            .set('Authorization', 'Bearer ' + token)
            .send(newBookmark)
            .expect(201)
            .expect(res => {
              expect(res.body.title).to.eql(newBookmark.title)
              expect(res.body.url).to.eql(newBookmark.url)
              expect(res.body.rating).to.eql(newBookmark.rating)
              expect(res.body.description).to.eql(newBookmark.description)
              expect(res.body).to.have.property('id')
              expect(res.headers.location).to.eql(`http://localhost:${PORT}/bookmarks/${res.body.id}`)
            })
            .then(postRes => 
              supertest(app)
              .get(`/bookmarks/${postRes.body.id}`)
              .set('Authorization', 'Bearer ' + token)
              .expect(postRes.body)
            )
        })
      })
    })
  })
})