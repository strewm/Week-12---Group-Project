const express = require('express');
const { csrfProtection, asyncHandler, handleValidationErrors } = require("../utils");
const db = require('../db/models');
const { Contact, Task } = db;

var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  if (res.locals.authenticated) {
    return res.redirect('/app')
  }
  res.render('index', { title: 'Gotta Latte Do' });
});

router.get('/app', csrfProtection, asyncHandler(async (req, res, next) => {
  if(!res.locals.userId) {
    res.redirect('/users/login')
  }
  console.log(res.locals.userId)
  const contacts = await Contact.findAll({
    where: {
      userId: res.locals.userId
    }
  })

  const tasks = await Task.findAll({
    where: {
      userId: res.locals.userId
    }
  })

    res.render('app', { csrfToken: req.csrfToken(), contacts, tasks })


}))

// // Get method that allows Sav to see /app
// router.get('/app', csrfProtection, asyncHandler(async (req, res, next) => {
//   res.render('app', { csrfToken: req.csrfToken() })
// }))


module.exports = router;
