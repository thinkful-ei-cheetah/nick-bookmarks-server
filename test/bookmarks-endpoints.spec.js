const knex = require('knex');
const app = require('../src/app');
const { API_TOKEN } = require('../src/config');
const {
  makeBookmarksArray,
  makeMaliciousBookmarks
} = require('./bookmarks.fixtures');
const auth = { Authorization: 'Bearer ' + API_TOKEN };

describe('Bookmarks Endpoints', () => {
  let db;

  before('make Knex Instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL
    });
    app.set('db', db);
  });

  after('disconnect from db', () => db.destroy());

  before('clean the table', () => db('bookmarks').truncate());

  afterEach('cleanup', () => db('bookmarks').truncate());

  describe('GET /api/bookmarks', () => {
    context('Given there are no bookmarks in the database', () => {
      it('GET /api/bookmarks responds with 200 and an empty list', () => {
        return supertest(app)
          .get('/api/bookmarks')
          .set(auth)
          .expect(200, []);
      });
    });

    context('Given there are bookmarks in the database', () => {
      const testBookmarks = makeBookmarksArray();

      beforeEach('insert bookmarks', () => {
        return db('bookmarks').insert(testBookmarks);
      });

      it('GET /api/bookmarks responds with 200 and all of the bookmarks', () => {
        return supertest(app)
          .get('/api/bookmarks')
          .set(auth)
          .expect(200, testBookmarks);
      });
    });

    context('Given there is an XSS attack bookmark', () => {
      const { maliciousBookmark, sanitizedBookmark } = makeMaliciousBookmarks();
      const testBookmarks = makeBookmarksArray();

      beforeEach(() => {
        return db('bookmarks').insert([...testBookmarks, maliciousBookmark]);
      });

      it('GET /api/bookmarks responds with 200 and all of the bookmarks sanitized', () => {
        return supertest(app)
          .get('/api/bookmarks')
          .set(auth)
          .expect(200, [...testBookmarks, sanitizedBookmark]);
      });
    });
  });

  describe('GET /api/bookmarks/:bookmark_id', () => {
    const testId = 3;

    context('Given there are no bookmarks in the database', () => {
      it('GET /api/bookmarks/:bookmark_id responds with 404', () => {
        return supertest(app)
          .get(`/api/bookmarks/${testId}`)
          .set(auth)
          .expect(404, { error: { message: 'Bookmark does not exist' } });
      });
    });

    context('Given there are bookmarks in the database', () => {
      const testBookmarks = makeBookmarksArray();

      beforeEach('insert bookmarks', () => {
        return db('bookmarks').insert(testBookmarks);
      });

      it('GET /api/bookmarks/:bookmark_id', () => {
        const expectedBookmark = testBookmarks[testId - 1];

        return supertest(app)
          .get(`/api/bookmarks/${testId}`)
          .set(auth)
          .expect(200, expectedBookmark);
      });
    });

    context('Given there is an XSS attack bookmark', () => {
      const { maliciousBookmark, sanitizedBookmark } = makeMaliciousBookmarks();

      beforeEach(() => {
        return db.into('bookmarks').insert([maliciousBookmark]);
      });

      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/api/bookmarks/${maliciousBookmark.id}`)
          .set(auth)
          .expect(200, sanitizedBookmark);
      });
    });
  });

  describe('POST /api/bookmarks', () => {
    it('creates a bookmark, responding with 201 and the new bookmark', () => {
      const newBookmark = {
        title: 'Test New Bookmark',
        url: 'https://www.test-bkmk.org',
        desc: 'Test Bookmark description text...',
        rating: 3
      };
      return supertest(app)
        .post('/api/bookmarks')
        .set(auth)
        .send(newBookmark)
        .expect(201)
        .expect(res => {
          expect(res.body.title).to.eql(newBookmark.title);
          expect(res.body.url).to.eql(newBookmark.url);
          expect(res.body.desc).to.eql(newBookmark.desc || '');
          expect(res.body).to.have.property('rating');
          expect(res.body).to.have.property('id');
        })
        .then(postRes =>
          supertest(app)
            .get(`/api/bookmarks/${postRes.body.id}`)
            .set(auth)
            .expect(postRes.body)
        );
    });

    const requiredFields = ['title', 'url', 'rating'];

    requiredFields.forEach(field => {
      const newBookmark = {
        title: 'Test New Bookmark',
        url: 'https://www.test-bkmk.org',
        desc: 'Test Bookmark description text...',
        rating: 3
      };

      it(`responds with 400 when the '${field}' is ${
        field !== 'rating' ? 'missing' : 'out of bounds'
      }`, () => {
        let expected = { error: { message: `${field} is required` } };

        if (field === 'rating') {
          newBookmark['rating'] = 123;
          expected = {
            error: {
              message: 'Rating must be between 1 and 5 (inclusive)'
            }
          };
        } else {
          delete newBookmark[field];
        }

        return supertest(app)
          .post('/api/bookmarks')
          .set(auth)
          .send(newBookmark)
          .expect(400, expected);
      });
    });

    context('Given an XSS attack bookmark', () => {
      it('creates a bookmark, responding with 201 and the sanitized bookmark', () => {
        const {
          maliciousBookmark,
          sanitizedBookmark
        } = makeMaliciousBookmarks();

        return supertest(app)
          .post('/api/bookmarks')
          .set(auth)
          .send(maliciousBookmark)
          .expect(201)
          .expect(res => {
            expect(res.body.title).to.eql(sanitizedBookmark.title);
            expect(res.body.url).to.eql(sanitizedBookmark.url);
            expect(res.body.desc).to.eql(sanitizedBookmark.desc || '');
            expect(res.body).to.have.property('id');
            expect(res.body).to.have.property('rating');
          })
          .then(postRes => {
            return supertest(app)
              .get(`/api/bookmarks/${postRes.body.id}`)
              .set(auth)
              .expect(postRes.body);
          });
      });
    });
  });

  describe('DELETE /api/bookmarks/:bookmark_id', () => {
    context('Given there are no bookmarks in the database', () => {
      it('responds with 404', () => {
        const idToRemove = 123;
        return supertest(app)
          .delete(`/api/bookmarks/${idToRemove}`)
          .set(auth)
          .expect(404, {
            error: { message: 'Bookmark does not exist' }
          });
      });
    });

    context('Given there are bookmarks in the database', () => {
      const testBookmarks = makeBookmarksArray();

      beforeEach(() => {
        return db.into('bookmarks').insert(testBookmarks);
      });

      it('responds with 204 and removes the bookmark', () => {
        const idToRemove = 2;
        const expectedBookmarks = testBookmarks.filter(
          bookmark => bookmark.id !== idToRemove
        );

        return supertest(app)
          .delete(`/api/bookmarks/${idToRemove}`)
          .set(auth)
          .expect(204)
          .then(res => {
            return supertest(app)
              .get('/api/bookmarks')
              .set(auth)
              .expect(expectedBookmarks);
          });
      });
    });
  });

  describe('PATCH /api/bookmarks/:bookmark_id', () => {
    context('Given there are no articles in the database', () => {
      it('should respond with 404', () => {
        const bookmarkId = 1;

        return supertest(app)
          .patch(`/api/bookmarks/${bookmarkId}`)
          .set(auth)
          .expect(404, {
            error: { message: 'Bookmark does not exist' }
          });
      });
    });

    context('Given tere are articles in the database', () => {
      const testBookmarks = makeBookmarksArray();

      beforeEach(() => {
        return db.insert(testBookmarks).into('bookmarks');
      });

      it('should respond with 204 and updates the article', () => {
        const idToUpdate = 2;

        const updatedBookmark = {
          title: 'Updated Bookmark Title',
          url: 'https://www.update-url.org',
          desc: 'Updated Bookmark description text.',
          rating: 3
        };

        const expectedBookmark = {
          ...testBookmarks[idToUpdate - 1],
          ...updatedBookmark
        };

        return supertest(app)
          .patch(`/api/bookmarks/${idToUpdate}`)
          .set(auth)
          .send(updatedBookmark)
          .expect(204)
          .then(() =>
            supertest(app)
              .get(`/api/bookmarks/${idToUpdate}`)
              .set(auth)
              .expect(expectedBookmark)
          );
      });

      it('should respond with 400 when no values are supplied for any fields', () => {
        const idToUpdate = 2;

        return supertest(app)
          .patch(`/api/bookmarks/${idToUpdate}`)
          .set(auth)
          .send({ irrelevantField: 'foo' })
          .expect(400, {
            error: {
              message: `Request body must contain either 'title', 'url', 'desc', or 'rating'`
            }
          });
      });

      it('should responds with 204 when updating only a subset of fields', () => {
        const idToUpdate = 2;

        const updatedBookmark = {
          title: 'Updated Article Title'
        };

        const expectedBookmark = {
          ...testBookmarks[idToUpdate - 1],
          ...updatedBookmark
        };

        return supertest(app)
          .patch(`/api/bookmarks/${idToUpdate}`)
          .set(auth)
          .send(updatedBookmark)
          .expect(204)
          .then(() =>
            supertest(app)
              .get(`/api/bookmarks/${idToUpdate}`)
              .set(auth)
              .expect(200, expectedBookmark)
          );
      });
    });
  });
});
