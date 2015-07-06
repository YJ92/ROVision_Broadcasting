var express = require('express');
var fs = require('fs');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/local',function(req,res, next){
  	res.sendfile("./public/local.html")
});

router.get('/remote',function(req,res, next){
  	res.sendfile("./public/remote.html")
});

module.exports = router;

