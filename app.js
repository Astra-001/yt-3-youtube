var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const fs = require("fs");
const localStorage = require("localStorage");
var app = express();

const OAuth2Data = require('./credentials.json');
const { google } = require('googleapis');

const CLIENT_ID = OAuth2Data.web.client_id;
const CLIENT_SECRET = OAuth2Data.web.client_secret;
const REDIRECT_URI = OAuth2Data.web.redirect_uris[0];

const OAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile';

localStorage.setItem("googleAuthed", "0")

var indexRouter = require('./routes/index');
const upload = require('./upload');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/v1/ytdownload', indexRouter);

app.get('/', (req, res) => {
  let authed = localStorage.getItem("googleAuthed");
 
  if (authed === "0") {
    console.log('Not Authorised');
    const url = OAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });

    res.render('index', { url: url, authorise: true});
  } else {
    res.render('index', { url: '', authorise: false});
  }
});

app.get('/google/callback', (req, res) => {
  const code = req.query.code;
  console.log( code );
  if (code) {
    OAuth2Client.getToken(code, (err, token) => {
      if (err) {
        console.log('Error in Authenticating: ', err);
      } else {
        console.log('Successfully Authenticated');

        OAuth2Client.setCredentials(token);

        localStorage.setItem("googleAuthed", "1")

        res.redirect('/');
      }
    });
  }
});



app.post('/uploadToDrive', (req, res) => {
  let mp3FolderPath = path.join(__dirname, 'public', 'static', 'mp3');
  req.body.title = req.body.title + ".mp3";
  console.log('mp3FolderPath:  ', mp3FolderPath);
  let filePath = path.join(mp3FolderPath, "/", req.body.title);
  console.log("filePath: ", filePath);

  const drive = google.drive({ version: 'v3', auth: OAuth2Client });

  upload.uploadSingleFile(req.body.title, filePath, drive).then(() => {
    console.log('🔥 All files have been uploaded to Google Drive successfully!');
    fs.unlink(filePath,function(err){
        if(err) return console.log(err);
        console.log('file deleted successfully');
    }); 
  });
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
