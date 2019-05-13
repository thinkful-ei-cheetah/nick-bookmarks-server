const express = require('express');
const logger = require('../logger');
const xssSanitizer = require('../xss-sanitizer');

const bookmarksRouter = express.Router();
const bookmarksService = require('../Services/bookmarks-service');
const bodyParser = express.json();

bookmarksRouter
  .route('/api/bookmarks')
  .get((req, res, next) => {
    bookmarksService
      .getAllBookmarks(req.app.get('db'))
      .then(bookmarks => {
        if (!bookmarks.length) {
          return res.json([]);
        }

        return res.json(bookmarks.map(bookmark => xssSanitizer(bookmark)));
      })
      .catch(next);
  })
  .post(bodyParser, (req, res, next) => {
    const { title, url, desc = '', rating } = req.body;
    const newBookmark = { title, url, desc, rating };

    for (const [key, value] of Object.entries(newBookmark)) {
      if (value == null) {
        logger.error(`${key} is required`);
        return res
          .status(400)
          .json({ error: { message: `${key} is required` } });
      }
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        error: { message: 'Rating must be between 1 and 5 (inclusive)' }
      });
    }

    bookmarksService
      .insertBookmark(req.app.get('db'), newBookmark)
      .then(bookmark => {
        logger.info(`Bookmark with id ${bookmark.id} created`);

        return res
          .status(201)
          .location(`/api/bookmarks/${bookmark.id}`)
          .json(xssSanitizer(bookmark));
      })
      .catch(next);
  });

bookmarksRouter
  .route('/api/bookmarks/:bookmark_id')
  .all((req, res, next) => {
    bookmarksService
      .getById(req.app.get('db'), req.params.bookmark_id)
      .then(bookmark => {
        if (!bookmark) {
          logger.error(`Bookmark does not exit.`);
          return res
            .status(404)
            .json({ error: { message: 'Bookmark does not exist' } });
        }

        res.bookmark = bookmark;
        next();
      })
      .catch(next)
  })
  .get((req, res, next) => {
    res.json(xssSanitizer(res.bookmark));
  })
  .delete((req, res, next) => {
    bookmarksService
      .deleteBookmark(req.app.get('db'), req.params.bookmark_id)
      .then(numROwsAffected => {
        logger.info(
          `Bookmark with id ${req.params.bookmark_id} deleted`
        );
        res.status(204).json()
      })
      .catch(next);
  })
  .patch(bodyParser, (req, res, next) => {
    const { title, url, desc, rating } = req.body;
    const bookmarkToUpdate = { title, url, desc, rating };

    const numberOfValues = Object.values(bookmarkToUpdate).filter(Boolean).length;
    if(numberOfValues === 0) {
      return res
        .status(400)
        .json({
          error: {
            message: `Request body must contain either 'title', 'url', 'desc', or 'rating'`
          }
        });
    }

    bookmarksService
      .updateBookmark(
        req.app.get('db'),
        req.params.bookmark_id,
        bookmarkToUpdate
      )
      .then(() => res.status(204).end())
      .catch(next);
  });

module.exports = bookmarksRouter;
