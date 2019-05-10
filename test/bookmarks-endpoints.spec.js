const knex = require('knex')
const app = require('../src/app')
const { API_TOKEN } = require('../src/config')
const { makeBookmarksArray, makeMaliciousBookmarks } = require('./bookmarks.fixtures')

describe.only('Bookmarks Endpoints', () => {
  let db

  before('make Knex Instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL
    })
    app.set('db', db)
  })

  after('disconnect from db', () => db.destroy())

  before('clean the table', () => db('bookmarks').truncate())

  afterEach('cleanup', () => db('bookmarks').truncate())

  describe('GET /bookmarks', () => {
    context('Given there are no bookmarks in the database', () => {
      it('GET /bookmarks responds with 200 and an empty list', () => {
        return supertest(app)
          .get('/bookmarks')
          .set('Authorization', 'Bearer ' + API_TOKEN)
          .expect(200, [])
      })
    })

    context('Given there are bookmarks in the database', () => {
      const testBookmarks = makeBookmarksArray()

      beforeEach('insert bookmarks', () => {
        return db('bookmarks').insert(testBookmarks)
      })

      it('GET /bookmarks responds with 200 and all of the bookmarks', () => {
        return supertest(app)
          .get('/bookmarks')
          .set('Authorization', 'Bearer ' + API_TOKEN)
          .expect(200, testBookmarks)
      })
    })
  })

  describe('GET /bookmarks/:bookmark_id', () => {
    const testId = 3

    context('Given there are no bookmarks in the database', () => {
      it('GET /bookmarks/:bookmark_id responds with 404', () => {
        return supertest(app)
          .get(`/bookmarks/${testId}`)
          .set('Authorization', 'Bearer ' + API_TOKEN)
          .expect(404, { error: { message: 'Bookmark does not exist' } })
      })
    })

    context('Given there are bookmarks in the database', () => {
      const testBookmarks = makeBookmarksArray()

      beforeEach('insert bookmarks', () => {
        return db('bookmarks').insert(testBookmarks)
      })

      it('GET /bookmarks/:bookmark_id', () => {
        const expectedBookmark = testBookmarks[testId - 1]

        return supertest(app)
          .get(`/bookmarks/${testId}`)
          .set('Authorization', 'Bearer ' + API_TOKEN)
          .expect(200, expectedBookmark)
      })
    })
  })

  describe('POST /bookmarks', () => {
    it('creates a bookmark, responding with 201 and the new bookmark', () => {
      const newBookmark = {
        title: 'Test New Bookmark',
        url: 'https://www.test-bkmk.org',
        desc: 'Test Bookmark description text...',
        rating: 3
      }
      return supertest(app)
        .post('/bookmarks')
        .set('Authorization', 'Bearer ' + API_TOKEN)
        .send(newBookmark)
        .expect(201)
        .expect(res => {
          expect(res.body.title).to.eql(newBookmark.title)
          expect(res.body.url).to.eql(newBookmark.url)
          expect(res.body.desc).to.eql(newBookmark.desc || '')
          expect(res.body).to.have.property('rating')
          expect(res.body).to.have.property('id')
        })
        .then(postRes =>
          supertest(app)
            .get(`/bookmarks/${postRes.body.id}`)
            .set('Authorization', 'Bearer ' + API_TOKEN)
            .expect(postRes.body)
        )
    })

    const requiredFields = ['title', 'url', 'rating']

    requiredFields.forEach(field => {
      const newBookmark = {
        title: 'Test New Bookmark',
        url: 'https://www.test-bkmk.org',
        desc: 'Test Bookmark description text...',
        rating: 3
      }

      it(`responds with 400 when the '${field}' is ${ field !== 'rating' ? 'missing' : 'out of bounds' }`, () => {
        let expected = { error: { message: `${field} is required` } }

        if (field === 'rating') {
          newBookmark['rating'] = 123
          expected = {
            error: {
              message: 'Rating must be between 1 and 5 (inclusive)'
            }
          }
        } else {
          delete newBookmark[field]
        }

        return supertest(app)
          .post('/bookmarks')
          .set('Authorization', 'Bearer ' + API_TOKEN)
          .send(newBookmark)
          .expect(400, expected)
      })
    })

    context('Given an XSS attack bookmark', () => {
      it('creates a bookmark, responding with 201 and the sanitized bookmark', () => {
        const { maliciousBookmark, sanitizedBookmark } = makeMaliciousBookmarks()

        return supertest(app)
          .post('/bookmarks')
          .set('Authorization', 'Bearer ' + API_TOKEN)
          .send(maliciousBookmark)
          .expect(201)
          .expect( res => {
            expect(res.body.title).to.eql(sanitizedBookmark.title)
            expect(res.body.url).to.eql(sanitizedBookmark.url)
            expect(res.body.desc).to.eql(sanitizedBookmark.desc || '')
            expect(res.body).to.have.property('id')
            expect(res.body).to.have.property('rating')
          })
          .then( postRes => {
            supertest(app)
              .get(`/bookmarks/${postRes.body.id}`)
              .expect(postRes.body)
          })
      })
    })
  })
})
