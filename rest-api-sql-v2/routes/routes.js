const express = require('express');
const router = express.Router();
const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('sqlite::memory:') // Example for sqlite
const User = require('../models').User;
const Course = require('../models').Course;

/* Handler function to wrap each route. */
function asyncHandler(cb){
  return async(req, res, next) => {
    try {
      await cb(req, res, next)
    } catch(error){
      res.status(500).send(error);
    }   
  }
}

// Testing router 
router.get('/', asyncHandler(async (req, res) => {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
  const users = await User.findAll();
  console.log(users);
  const courses = await Course.findAll();
  console.log(courses);
  res.send('Hello world');
}));

// GET Obtains the currently authenticated user. 
router.get('/users', asyncHandler(async (req, res) => {
    res.status(200).end();
}));


// POST Creates a new user
router.post('/users', asyncHandler(async (req, res) => {
    const user = req.body;

    // It seems like usually I would want to add things to a db and not push to an array. 
    users.push(user);
  
    // Set the status to 201 Created and end the response.
    res.status(201).end();
}));

// GET Obtains the currently authenticated user. 
router.get('/courses', asyncHandler(async (req, res) => {
    const courses = await Course.findAll();
    res.json(courses);
    res.status(200).end();
}));

// GET Obtains the currently authenticated user. 
router.get('/courses/:id', asyncHandler(async (req, res) => {
    const course = await Course.findByPk(req.params.id);
    res.json(course);
    res.status(200).end();
}));

module.exports = router;
