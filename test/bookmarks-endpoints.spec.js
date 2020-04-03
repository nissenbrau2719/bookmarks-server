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
    
    describe(`GET /api/bookmarks`, () => {

      context(`Given there are no bookmarks saved`, () => {
        it(`responds with 200 and an empty list`, () => {
          return supertest(app)
            .get('/api/bookmarks')
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
            .get('/api/bookmarks')
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
            .get('/api/bookmarks')
            .set('Authorization', 'Bearer ' + token)
            .expect(200)
            .expect(res => {
              expect(res.body[0].title).to.eql(expectedBookmark.title)
              expect(res.body[0].description).to.eql(expectedBookmark.description)
            })
        })
      })
    })

    describe(`GET /api/bookmarks/:id`, () => {
      context(`Given bookmark with provided 'id' doesn't exist`, () => {
        it('responds with 404', () => {
          const bookmarkId = 1234567890
          return supertest(app)
            .get(`/api/bookmarks/${bookmarkId}`)
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
            .get(`/api/bookmarks/${bookmarkId}`)
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
            .post('/api/bookmarks')
            .set('Authorization', 'Bearer ' + token)
            .send(newBookmark)
            .expect(201)
            .expect(res => {
              expect(res.body.title).to.eql(newBookmark.title)
              expect(res.body.url).to.eql(newBookmark.url)
              expect(res.body.rating).to.eql(newBookmark.rating)
              expect(res.body.description).to.eql(newBookmark.description)
              expect(res.body).to.have.property('id')
              expect(res.headers.location).to.eql(`http://localhost:${PORT}/api/bookmarks/${res.body.id}`)
            })
            .then(postRes => 
              supertest(app)
              .get(`/api/bookmarks/${postRes.body.id}`)
              .set('Authorization', 'Bearer ' + token)
              .expect(postRes.body)
            )
        })
      })

      context('A required field is missing from the posted bookmark', () => {
        const requiredFields = [ 'url', 'title' ]

        requiredFields.forEach(field => {
          const newBookmark = {
            title: 'Test bookmark',
            url: 'www.testwebsite.com'
          }

          it(`responds with 400 and an error message when the '${field}' is missing`, () => {
            delete newBookmark[field]
            return supertest(app)
              .post('/api/bookmarks')
              .set('Authorization', 'Bearer ' + token)
              .send(newBookmark)
              .expect(400, {
                error: { message: `${field} is required`}
              })
          })  
        })
      })

      context(`the URL posted is not a valid URL`, () => {
        const newBookmark = {
          title: 'Test bookmark',
          url: 'not a valid url'
        }

        it('responds with 400 and an error message', () => {
          return supertest(app)
            .post('/api/bookmarks')
            .set('Authorization', 'Bearer ' + token)
            .send(newBookmark)
            .expect(400, {
              error: { message: `url is not valid`}
            })
        })
      })

      context(`the bookmark posted has malicious XSS content`, () => {
        const maliciousBookmark = makeMaliciousBookmark()
        const expectedBookmark = makeSanitizedBookmark()
        it('creates the bookmark but sanitizes the malicious content', () => {
          return supertest(app)
            .post('/api/bookmarks')
            .set('Authorization', 'Bearer ' + token)
            .send(maliciousBookmark)
            .expect(201)
            .expect(res => {
              expect(res.body.title).to.eql(expectedBookmark.title)
              expect(res.body.description).to.eql(expectedBookmark.description)
            })
            .then(postRes => 
              supertest(app)
                .get(`/api/bookmarks/${postRes.body.id}`)
                .set('Authorization', 'Bearer ' + token)
                .expect(postRes.body)
            )
        })
      })
    })

    describe('DELETE /api/bookmarks/:id', () => {
      const testBookmarks = makeBookmarksArray()

      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks)
      })

      context('Given the bookmark to delete exists in the database', () => {
        it('responds with 204 and removes the bookmark', () => {
          const idToRemove = 4
          const expectedBookmarks = testBookmarks.filter(bookmark => bookmark.id !== idToRemove)
          return supertest(app)
            .delete(`/api/bookmarks/${idToRemove}`)
            .set('Authorization', 'Bearer ' + token)
            .expect(204)
            .then(res => 
              supertest(app)
              .get('/api/bookmarks')
              .set('Authorization', 'Bearer ' + token)
              .expect(expectedBookmarks)
            )
        })
      })

      context(`Given the bookmark to be deleted doesn't exist`, () => {
        it('responds with 404 and an error message', () => {
          const idToRemove = 1234567890
          return supertest(app)
            .delete(`/api/bookmarks/${idToRemove}`)
            .set('Authorization', 'Bearer ' + token)
            .expect(404, {
              error: { message: 'Bookmark not found' }
            })
        })
      })
    })

    describe(`PATCH /api/bookmarks/:id`, () => {
      context('Given no bookmark in database', () => {
        it('responds with 404', () => {
          const bookmarkId = 123456
          return supertest(app)
            .patch(`/api/bookmarks/${bookmarkId}`)
            .set('Authorization', 'Bearer ' + token)
            .expect(404, {error: { message: 'Bookmark not found' }})
        })
      })
      context('Given there are bookmarks in the database', () => {
        const testBookmarks = makeBookmarksArray()

        beforeEach('insert bookmarks', () => {
          return db
          .into('bookmarks')
          .insert(testBookmarks)
        })
        
        it('responds with 204 and updates the bookmark', () => {
          const idToUpdate = 3
          const updateBookmark = {
            title: 'updated bookmark title',
            url: 'www.newwebsite.com',
            rating: '3',
            description: 'updated website description'
          }
          const expectedBookmark = {
            ...testBookmarks[idToUpdate - 1],
            ...updateBookmark
          }
          return supertest(app)
            .patch(`/api/bookmarks/${idToUpdate}`)
            .set('Authorization', 'Bearer ' + token)
            .send(updateBookmark)
            .expect(204)
            .then(res => 
              supertest(app)
                .get(`/api/bookmarks/${idToUpdate}`)
                .set('Authorization', 'Bearer ' + token)
                .expect(expectedBookmark))
        })

        it(`responds with 400 when no relevant fields are supplied`, () => {
          const idToUpdate = 3
          return supertest(app)
          .patch(`/api/bookmarks/${idToUpdate}`)
          .set('Authorization', 'Bearer ' + token)
          .send({ irrelevantField: 'foo' })
          .expect(400, {
            error: {
              message: `Request body must contain an update to 'title', 'url', 'rating', or 'description'`
            }
          })
        })

        it(`responds with 204 when updating only a subset of the relevant fields`, () => {
          const idToUpdate = 3
          const updateBookmark = {
            title: 'updated title'
          }
          const expectedBookmark = {
            ...testBookmarks[idToUpdate - 1],
            ...updateBookmark
          }

          return supertest(app)
            .patch(`/api/bookmarks/${idToUpdate}`)
            .set('Authorization', 'Bearer ' + token)
            .send({
              ...updateBookmark,
              fieldToIgnore: 'should not be in GET response'
            })
            .expect(204)
            .then(res => 
              supertest(app)
                .get(`/api/bookmarks/${idToUpdate}`)
                .set('Authorization', 'Bearer ' + token)
                .expect(expectedBookmark)
            )
        })

        it(`responds 204 and sanitizes any potentially malicious xss content from updated title or description fields`, () => {
          const idToUpdate = 3
          const maliciousBookmarkUpdate = {
            title: 'Naughty naughty very naughty <script>alert("xss");</script>',
            description: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
          }
          const sanitizedBookmarkUpdate = {
            title: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
            description: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`,
          }
          const expectedBookmark = {
            ...testBookmarks[idToUpdate - 1],
            ...sanitizedBookmarkUpdate
          }

          return supertest(app)
            .patch(`/api/bookmarks/${idToUpdate}`)
            .set('Authorization', 'Bearer ' + token)
            .send(maliciousBookmarkUpdate)
            .expect(204)
            .then(res => 
              supertest(app)
                .get(`/api/bookmarks/${idToUpdate}`)
                .set('Authorization', 'Bearer ' + token)
                .expect(expectedBookmark)
            )
        })      
      })
    })
  })
})