const express = require('express');
const router = express.Router();

// Ability to connect with the DB
const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('sqlite::memory:') 
const User = require('../models').User;
const Course = require('../models').Course;

// Means of hashing passwords
const bcryptjs = require('bcryptjs');

// Tool for basic-auth
const auth = require('basic-auth');

// Validator module
const { check, validationResult } = require('express-validator/check');

// Handler function to wrap each route.
function asyncHandler(cb){
    return async(req, res, next) => {
      try {
        await cb(req, res, next)
      } catch(error){
        res.status(500).send(error);
      }   
    }
  }

// Array of validation objects (with methods to specify rules).
const validationChain = [ 
    check('firstName')
    .exists({ checkNull: true, checkFalsy: true })
    .withMessage('Please provide a first name'),
    check('lastName')
    .exists({ checkNull: true, checkFalsy: true })
    .withMessage('Please provide a last name'),
    check('emailAddress')
    .exists({ checkNull: true, checkFalsy: true })
    .withMessage('Please provide an "email" address')
    .isEmail()
    .withMessage('Please provide a valid "email" address'),
    check('password')
    .exists({ checkNull: true, checkFalsy: true })
    .withMessage('Please provide a password'),
];

// Middleware for user authentication. 
const authenticateUser = async (req, res, next) => {
    let message = null;
    const credentials = auth(req);

    if (credentials) {
        const user = await User.findOne({
            where: {
                emailAddress: credentials.name
            },
        });
        if (user) {
            const authenticated = bcryptjs
            .compareSync(credentials.pass, user.password);
            console.log(authenticated);
            if (authenticated) {
                req.currentUser = user;
                console.log(req.currentUser);
            } 
            else {
                message = `Authentication failure for username: ${user.emailAddress}`;
            }
        }
        else {
            message = `User not found for username: ${user.emailAddress}`;
        }
    }
    else {
        message = 'Auth header not found';
    }

    if (message) {
        console.warn(message);
        res.status(401).json({ message: 'Access Denied' });
    }
    else {
        next();
    }
  }

// GET Obtains the currently authenticated user. 
router.get('/users', authenticateUser, asyncHandler(async (req, res) => {
    const user = req.currentUser;
    res.json({
        firstName: user.firstName,
        lastName: user.lastName,
        emailAddress: user.emailAddress
    });
    res.status(200).end();
}));

// POST Creates a new user
// Implements primary error control through validationChain
// Secondary error handling through sequelize validation. 
router.post('/users', validationChain, asyncHandler(async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(error => error.msg);
            res.status(400).json({ errors: errorMessages })
        }
        else {
            let existingEmailAddress = await User.findOne({
                where: {
                  emailAddress: req.body.emailAddress
                }
              });
            if (!existingEmailAddress) {
                req.body.password = bcryptjs.hashSync(req.body.password);
                const user = User.create(req.body);
                res.status(201).location('/').end();
            }
            else {
                res.status(400).json({ "Error": "Sorry, that email address is already in use" });
            }
        }
    }
    catch (error) {
        if (error.name == "SequelizeValidationError") {
            res.status(400);
            res.json({ "Validation Error": error.message });
        }
        else {
            throw error;
        }
    }
}));

// GET Obtains the complete list of courses.  
router.get('/courses', asyncHandler(async (req, res) => {
   const courses = await Course.findAll({
    attributes: ["id", "userId", "title", "description", "estimatedTime", "materialsNeeded"],
    include: [{
      model: User,
      attributes: ["id", "firstName", "lastName", "emailAddress"]
    }]
  }).then(courses => res.json({ courses }));
    res.status(200).end();
}));

// GET Obtains the course with the pertinent ID. 
router.get('/courses/:id', asyncHandler(async (req, res) => {
    const course = await Course.findByPk(req.params.id);
    res.json(course);
    res.status(200).end();
}));

// POST Creates a new course.
// Implements primary error handling through vanilla JS.
// Implements secondary error handling through sequelize validation.
router.post('/courses', authenticateUser, asyncHandler(async (req, res, next) => {
    const errors = [];
    try {
        if (!req.body.title) {
            errors.push('Please provide a title for the course');
        }
        if (!req.body.description) {
            errors.push('Please provide a description for the course');
        }
        if (errors.length > 0) {
            res.status(400).json({ errors });
        }
        else {
            const course = await Course.create(req.body);
            res.status(201).location('api/courses/' + course.id).end();
        }
    }
    catch (error) {
        if (error.name == "SequelizeValidationError") {
            res.status(400);
            res.json({ "Validation Error": error.message });
        }
        else {
            throw error;
        }
    }
}));

// PUT Creates a new course.
// Implements primary error handling through vanilla JS.
// Implements secondary error handling through sequelize validation.
router.put('/courses/:id', authenticateUser, asyncHandler(async (req, res) => {
    const errors = [];
    try {
        if (!req.body.title) {
            errors.push('Please provide a title for the course');
        }
        if (!req.body.description) {
            errors.push('Please provide a description for the course');
        }
        if (errors.length > 0) {
            res.status(400).json({ errors });
        }
        else {
            const course = await Course.findByPk(req.params.id);
            await course.update(req.body);
            res.status(204).end();
        }
    }
    catch (error) {
        if (error.name == "SequelizeValidationError") {
            res.status(400);
            res.json({ "Validation Error": error.message });
        }
        else {
            throw error;
        }

    }
}));

// DELETE Removes a course.
router.delete('/courses/:id', authenticateUser, asyncHandler(async (req, res) => {
    const course = await Course.findByPk(req.params.id);
    await course.destroy();
    res.status(204).end();
}));

module.exports = router;
