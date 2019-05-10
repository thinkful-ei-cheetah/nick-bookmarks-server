const express = require('express')
const logger = require('../logger')
const xssSanitizer = require('../xss-sanitizer')

const bookmarksRouter = express.Router()
const bookmarksService = require('../Services/bookmarks-service')
const bodyParser = express.json()

bookmarksRouter
  .route('/bookmarks')
  .get((req, res, next) => {
    bookmarksService
      .getAllBookmarks(req.app.get('db'))
      .then(bookmarks => {
        if (!bookmarks.length) {
          return res.json([])
        }

        return res.json(bookmarks.map(bookmark => xssSanitizer(bookmark)))
      })
      .catch(next)
  })
  .post(bodyParser, (req, res, next) => {
    const { title, url, desc = '', rating } = req.body
    const newBookmark = { title, url, desc, rating }

    for (const [key, value] of Object.entries(newBookmark)) {
      if (!value) {
        logger.error(`${key} is required`)
        return res
          .status(400)
          .json({ error: { message: `${key} is required` } })
      }
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        error: { message: 'Rating must be between 1 and 5 (inclusive)' }
      })
    }

    bookmarksService
      .insertBookmark(req.app.get('db'), newBookmark)
      .then(bookmark => {
        logger.info(`Bookmark with id ${bookmark.id} created`)

        return res
          .status(201)
          .location(`/bookmarks/${bookmark.id}`)
          .json(xssSanitizer(bookmark))
      })
      .catch(next)
  })

bookmarksRouter
  .route('/bookmarks/:bookmark_id')
  .all((req, res, next) => {
    bookmarksService
      .getById(req.app.get('db'), req.params.bookmark_id)
      .then(bookmark => {
        if (!bookmark) {
          logger.error(`Bookmark does not exit.`)
          return res
            .status(404)
            .json({ error: { message: 'Bookmark does not exist' } })
        }

        res.bookmark = bookmark
        next()
      })
  })
  .get((req, res, next) => {
    res.json(xssSanitizer(res.bookmark))
  })
  .delete((req, res, next) => {
    bookmarksService
      .deleteBookmark(req.app.get('db'), req.params.bookmark_id)
      .then(bookmark => res.status(204).end())
      .catch(next)
  })

module.exports = bookmarksRouter
