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
      return res
        .status(400)
        .json({
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
  .route('/bookmarks/:id')
  .get((req, res, next) => {
    const { id } = req.params
    const knexInstance = req.app.get('db')

    bookmarksService
      .getById(knexInstance, id)
      .then(bookmark => {
        if (!bookmark) {
          logger.error(`Bookmark with id ${id} not found.`)
          return res
            .status(404)
            .json({ error: { message: 'Bookmark does not exist' } })
        }

        res.json(xssSanitizer(bookmark))
      })
      .catch(next)
  })
  .delete((req, res) => {
    // const { id } = req.params
    // const bookmarkIndex = bookmarks.findIndex(bookmark => bookmark.id === id)

    // if (bookmarkIndex === -1) {
    //   logger.error(`Bookmark with id ${id} not found`)
    //   return res.status(404).send('Not found')
    // }

    // bookmarks.splice(bookmarkIndex, 1)

    // logger.info(`Bookmark with id ${id} deleted`)

    // res.status(200).end()
  })

module.exports = bookmarksRouter
