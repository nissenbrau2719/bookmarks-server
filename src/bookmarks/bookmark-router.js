const express = require('express');
const { v4: uuid } = require('uuid');
const logger = require('../logger');
const { PORT } = require('../config');
const validator = require('validator');
const BookmarksService = require('./bookmarks-service');
const xss = require('xss');

const bookmarkRouter = express.Router();
const bodyParser = express.json();

bookmarkRouter
  .route('/')
  .get((req, res, next) => {
    BookmarksService.getAllBookmarks(req.app.get('db'))
    .then(bookmarks => {
      let sanitizedBookmarks = []
      for(const bookmark of bookmarks) {
        sanitizedBookmarks.push({
          title: xss(bookmark.title),
          description: xss(bookmark.description),
          id: bookmark.id,
          url: bookmark.url,
          rating: bookmark.rating
        })
      }
      res.json(sanitizedBookmarks)
    })
    .catch(next)
  })
  .post(bodyParser, (req, res, next) => {
    const { title, url, description="", rating=1 } = req.body;

    // validate request body
    if (!title) {
      logger.error('Title is required');
      return res 
        .status(400)
        .json({
          error: { message: 'title is required' }
        });
    }

    if (!url) {
      logger.error('URL is required');
      return res 
        .status(400)
        .json({
          error: { message: 'url is required' }
        });
    }

    // validate that URL is properly formatted
    const validURL = validator.isURL(url);
    if (validURL === false) {
      logger.error('URL is not valid');
      return res
        .status(400)
        .json({
          error: { message: 'url is not valid' }
        });
    }

    const newBookmark = {
      title: xss(title),
      url: url,
      description: xss(description),
      rating: rating
    };

    BookmarksService.insertBookmark(req.app.get('db'), newBookmark)
      .then(bookmark => {
        logger.info(`Bookmark with id ${bookmark.id} created`)
        res
          .status(201)
          .location(`http://localhost:${PORT}/bookmarks/${bookmark.id}`)
          .json(bookmark)
      })
      .catch(next)
  })

//build routes to GET and DELETE at /bookmarks/:id
bookmarkRouter
  .route('/:id')
  .all((req, res, next) => {
    const { id } = req.params
    BookmarksService.getById(req.app.get('db'), id)
      .then(bookmark => {
        if (!bookmark) {
          logger.error(`Bookmark with id ${id} not found.`);
          return res
            .status(404)
            .json({
              error: { message: 'Bookmark not found' }
            })
        }
        res.bookmark = bookmark
        next()
      })
      .catch(next)
  })
  .get((req, res, next) => {
    res.json({
      id: res.bookmark.id,
      url: res.bookmark.url,
      rating: res.bookmark.rating,
      title: xss(res.bookmark.title),
      description: xss(res.bookmark.description)
    });
  })
  .delete((req, res, next) => {
    const { id } = req.params
    BookmarksService.deleteBookmark(req.app.get('db'), id)
      .then(() => {
        logger.info(`Bookmark with id ${id} deleted.`)
        res.status(204).end()
      })
      .catch(next)
  });

module.exports = bookmarkRouter;