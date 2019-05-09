const express = require('express')
const uuid = require('uuid/v4')
const logger = require('../logger')
const bookmarks = require('../store')

const bookmarksRouter = express.Router()
const bookmarksService = require('../Services/bookmarks-service')
const bodyParser = express.json()

bookmarksRouter
  .route('/bookmarks')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db')

    bookmarksService
      .getAllBookmarks(knexInstance)
      .then(bookmarks => res.json(bookmarks))
      .catch(next)
  })
  .post(bodyParser, (req, res) => {
    const { title, url, desc = '', rating = '5' } = req.body

    if (!title) {
      logger.error('Title is required')
      return res.status(400).send('Invalid data')
    }

    if (!url) {
      logger.error('URL is required')
      return res.status(400).send('Invalid data')
    }

    const id = uuid()

    const bookmark = {
      id,
      title,
      url,
      desc,
      rating
    }

    bookmarks.push(bookmark)

    logger.info(`Bookmark with id ${id} created`)

    res
      .status(200)
      .location(`/bookmarks/${id}`)
      .json(bookmark)
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

        res.json(bookmark)
      })
      .catch(next)
  })
  .delete((req, res) => {
    const { id } = req.params
    const bookmarkIndex = bookmarks.findIndex(bookmark => bookmark.id === id)

    if (bookmarkIndex === -1) {
      logger.error(`Bookmark with id ${id} not found`)
      return res.status(404).send('Not found')
    }

    bookmarks.splice(bookmarkIndex, 1)

    logger.info(`Bookmark with id ${id} deleted`)

    res.status(200).end()
  })

module.exports = bookmarksRouter
