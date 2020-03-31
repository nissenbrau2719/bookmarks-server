require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const { NODE_ENV } = require('./config');
const bookmarksRouter = require('./bookmarks/bookmark-router');
const validateBearerToken = require('./token-validation');
const errorHandler = require('./error-handler');

const app = express();

const morganOption = (NODE_ENV === 'production')
  ? 'tiny'
  : 'common';

app.use(morgan(morganOption));
app.use(helmet());
app.use(cors());

app.use(validateBearerToken);

app.use('/bookmarks', bookmarksRouter);

app.get('/', (req, res) => {
  res.send('Hello, Paul!');
});

app.use(errorHandler);

module.exports = app;