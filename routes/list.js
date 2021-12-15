const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const app = require('../app');
const db = require('../db/models');
const { asyncHandler, csrfProtection, handleValidationErrors } = require('../utils');
const { Contact, User, List } = db;

const validateLists = [
    check('title')
      .exists({checkFalsy: true})
      .withMessage('Please provide a title for this list')
      .isLength({ max: 50 })
      .withMessage('List name must not be more than 50 characters')
  ]

  const listNotFoundError = (id) => {
    const error = Error(`List with id of ${id} could not be found`)
    error.title = 'List not found'
    error.status = 404;
    return error;
  }


  router.get('/new', csrfProtection, asyncHandler(async (req, res, next) => {
    if(!res.locals.userId) {
      res.redirect('/users/login')
    }

    res.render('add-list')
  }))

  router.post('/', asyncHandler(async (req, res, next) => {
    const { title } = req.body;
    const userId = res.locals.userId;

    try {
        const newList = await List.create({
        userId,
        title
    })

    res.status(201).json({newList})
    } catch (e) {
        next()
    }

}))

module.exports = router;
