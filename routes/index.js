var express = require('express');
var router = express.Router();
const ConnectionController = require('../src/controllers/connection')
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/api/subscribe', ConnectionController.subscribe);
router.get('/api/subscribe/terminal', ConnectionController.subscribeTerminal);
router.get('/api/initialize', ConnectionController.initialize);
router.get('/api/analyze', ConnectionController.getMessages);
router.get('/api/members', ConnectionController.listOfGroupMembers);
router.get('/api/test', ConnectionController.tester)

module.exports = router;
