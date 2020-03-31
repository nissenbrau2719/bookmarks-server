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
    const knexInstance = req.app.get('db')
    BookmarksService.getAllBookmarks(knexInstance)
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
  .post(bodyParser, (req, res) => {
    const { title, url, description="", rating=1 } = req.body;

    // validate request body
    if (!title) {
      logger.error('Title is required');
      return res 
        .status(400)
        .send('Invalid data');
    }

    if (!url) {
      logger.error('URL is required');
      return res 
        .status(400)
        .send('Invalid data');
    }

    // validate that URL is properly formatted
    const validURL = validator.isURL(url);
    if (validURL === false) {
      logger.error('URL is not valid');
      return res
        .status(400)
        .send('Invalid data');
    }

    const id = uuid();

    const bookmark = {
      id,
      title,
      url,
      description,
      rating
    };

    bookmarks.push(bookmark);

    logger.info(`Bookmark with id ${id} created`);

    res
      .status(201)
      .location(`http//localhost:${PORT}/bookmarks/${id}`)
      .json(bookmark);

  })

//build routes to GET and DELETE at /bookmarks/:id
bookmarkRouter
  .route('/:id')
  .get((req, res, next) => {
    const { id } = req.params;
    const knexInstance = req.app.get('db')
    BookmarksService.getById(knexInstance, id) 
      .then(bookmark => {
        if (!bookmark) {
          logger.error(`Bookmark with id ${id} not found.`);
          return res
            .status(404)
            .json({
              error: { message: 'Bookmark not found' }
            })
        }
        res.json(bookmark);
      })
      .catch(next)
  })
  .delete((req, res) => {
    const { id } = req.params;

    // validate that bookmark exists
    const bookmarkIndex = bookmarks.findIndex(bm => bm.id == id);    
    if (bookmarkIndex === -1) {
      logger.error(`Bookmark with id ${id} not found.`);
      return res
        .status(404)
        .send('Not Found');
    }

    bookmarks.splice(bookmarkIndex, 1);

    logger.info(`Bookmark with id ${id} deleted.`);
    res
      .status(204)
      .end();
  });

module.exports = bookmarkRouter;