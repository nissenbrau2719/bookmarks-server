const express = require('express');
const { v4: uuid } = require('uuid');
const logger = require('./logger');

const bookmarks = [{
  title: "google",
  url: "https://www.google.com",
  description: "most popular search engine",
  rating: 5,
  id: 1
}]

bookmarkRouter = express.Router()

//build routes to GET and POST at /bookmarks

//build routes to GET and DELETE at /bookmarks/:id

module.exports = bookmarkRouter;