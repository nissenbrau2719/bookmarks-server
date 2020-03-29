require('dotenv').config();
const knex = require('knex');
const app = require('../src/app');
const { makeBookmarksArray } = require('./bookmarks.fixtures');

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
  })
})