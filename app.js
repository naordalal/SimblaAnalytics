
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var cookieSession = require('cookie-session')

var index = require('./routes/index');
var visit = require('./routes/visit');
var dashboard = require('./routes/dashboard');
var app = express();
const uuidv1 = require('uuid/v1');

// view engine setup
//app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'jade');

//Using html to render the pages.
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.use(cookieSession({
    name: 'session',
    keys: ['key'],
}));

app.use(function (req, res, next) {

    if(req.get('origin'))
        res.setHeader('Access-Control-Allow-Origin', req.get('origin'));
    else
        res.setHeader('Access-Control-Allow-Origin', '132.73.211.205');
    res.setHeader('Access-Control-Allow-Credentials', true);
    // Pass to next layer of middleware

    var sessionId = uuidv1();
    if(!req.session.id)
        req.session.id = sessionId;

    next();

});

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/visit', visit);
app.use('/dashboard',dashboard);
app.get('/visitEvent' , visit.sse.init);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
