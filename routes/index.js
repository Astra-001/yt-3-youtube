const express = require('express');
var router = express.Router();
const path = require('path');
const fs = require("fs");
const YoutubeMp3Downloader = require('youtube-mp3-downloader');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);

router.post('/', (req, res) => {

  let queryPattern = /\?/;
  let { url } = req.body;

  const { socketid } = req.body;
  let videoId = '';

  if (queryPattern.test(url)) {
    let splitUrlByEqual = url.split('=');
    let eIndex = splitUrlByEqual.length - 1;
    videoId = splitUrlByEqual[eIndex];
  } else {
    let splitUrlBySlash = url.split('/');
    let index = splitUrlBySlash.length - 1;
    videoId = splitUrlBySlash[index];
  }

  let YD = new YoutubeMp3Downloader({
    outputPath: path.join(__dirname, '..', 'public', 'static', 'mp3'),
    // outputPath: path.join(__dirname, '..'),
    youtubeVideoQuality: 'highestaudio',
    queueParallelism: 2,
    progressTimeout: 2000,
    allowWebm: false,
  });

  YD.download(videoId);

  YD.on('finished', function (err, data) {
    
    global.io.to(socketid).emit('progress', 100, data);
  });

  YD.on("queueSize", function(size) {
      console.log(size);
  });

  YD.on('error', function (error) {
    console.log(error);
  });

  YD.on('progress', function (progress) {
    let downloadProgressData = Math.round(progress.progress.percentage);
    console.log( progress );
    global.io.to(socketid).emit('progress', downloadProgressData);
  });
  res.json(1)
});

module.exports = router;
