'use strict';

// load modules
const express = require('express');
const morgan = require('morgan');

// DB Modules
const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('sqlite::memory:') 

// variable to enable global error logging
const enableGlobalErrorLogging = process.env.ENABLE_GLOBAL_ERROR_LOGGING === 'true';

// Require directory for API routing.
const routes = require('./routes/routes');

// create the Express app
const app = express();

// Verify connection to the DB. 
(async () => {
  try {
    console.log('Connection to the database successful!');
    await sequelize.authenticate();
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      const errors = error.errors.map(err => err.message);
      console.error('Validation errors: ', errors);
    } else {
      throw error;
    }
  }
})();

// setup morgan which gives us http request logging
app.use(morgan('dev'));

// JSON Body Parser, Not stock
app.use(express.json())

// TODO setup your api routes here
app.use('/api', routes);

// setup a friendly greeting for the root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the REST API project!',
  });
});

// send 404 if no other route matched
app.use((req, res) => {
  res.status(404).json({
    message: 'Route Not Found',
  });
});

// setup a global error handler
app.use((err, req, res, next) => {
  if (enableGlobalErrorLogging) {
    console.error(`Global error handler: ${JSON.stringify(err.stack)}`);
  }

  res.status(err.status || 500).json({
    message: err.message,
    error: {},
  });
});

// set our port
app.set('port', process.env.PORT || 5000);

// start listening on our port
const server = app.listen(app.get('port'), () => {
  console.log(`Express server is listening on port ${server.address().port}`);
});

module.exports = app;