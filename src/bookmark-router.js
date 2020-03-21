const express = require('express');
const { v4: uuid } = require('uuid');
const logger = require('./logger');
const { PORT } = require('./config');

const bookmarks = [{
  title: "google",
  url: "https://www.google.com",
  description: "most popular search engine",
  rating: 5,
  id: 1
}]

const bookmarkRouter = express.Router();
const bodyParser = express.json();

//build routes to GET and POST at /bookmarks
bookmarkRouter
  .route('/bookmarks')
  .get((req, res) => {
    res.json(bookmarks)
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
      // code here

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
  .route('/bookmarks/:id')
  .get((req, res) => {
    const { id } = req.params;
    const bookmark = bookmarks.find(bm => bm.id == id);

    if (!bookmark) {
      logger.error(`Bookmark with id ${id} not found.`);
      return res
        .status(404)
        .send('Bookmark not found');
    }

    res.json(bookmark);
  })
  .delete((req, res) => {

  })

module.exports = bookmarkRouter;