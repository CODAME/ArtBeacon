#!/usr/bin/env node

var async = require('async')
  , opts = require("nomnom").parse()
  , validator = require('validator')
  , gifFrames = require('./gif-frames');


var OPC = new require('./opc')
var client = new OPC('localhost', 7890);

var brightness = 0.3;
var framesPerSecond = 10;

var pixels = [];


var gifName = opts['0'] || './codame.gif';


if (!validator.isURL(gifName)) {
	gifName = __dirname + "/" + gifName;
}


// var counter = 0;
// var images = [];



// gifFrames.frames(gifName, function(err, frames) {
// 	if (err) throw err;
// 	gifFrames.frameRate(gifName, function(e, rate) {
// 		if (e) throw e;
// 		var frameDelay = opts['1'] ? parseInt(opts['1'], 10) : rate;
// 		console.log("framerate: " + rate);
// 		play(frames, rate);
// 	});
// });






var panelOffsetMap = [
   [256, 0],
   [320, 64],
   [384, 128],
   [448, 192]
 ];

var panelIndexMap = [
    [63,48,47,32,31,16,15, 0],
    [62,49,46,33,30,17,14, 1],
    [61,50,45,34,29,18,13, 2],
    [60,51,44,35,28,19,12, 3],
    [59,52,43,36,27,20,11, 4],
    [58,53,42,37,26,21,10, 5],
    [57,54,41,38,25,22, 9, 6],
    [56,55,40,39,24,23, 8, 7]
 ];
 

var imgCoordinateMap = [];

for (var y = 0; y < 32; y++) {
    for (var x = 0; x < 16; x++) {
		var i = x + (y * 16);
		var panelOffset = panelOffsetMap[Math.floor(y/8)][Math.floor(x/8)];
		var panelIndex = panelIndexMap[y%8][x%8];
		imgCoordinateMap[i] = panelOffset + panelIndex;
    }
}
 

 
function drawFrame(data) {
	if (data && data.length == 512) {
	    for (var pixel = 0; pixel < 512; pixel++) {
	        var x = pixel % 16,
	            y = Math.floor(pixel / 16);
	            
	        var red =   data[pixel][0],
	            green = data[pixel][1],
	            blue =  data[pixel][2];

	        client.setPixel(imgCoordinateMap[pixel], red * brightness, green * brightness, blue * brightness);
	    }
	    client.writePixels();
	}

}



function play(images, framerate) {
	// var frame = 0;
	// var px = []; //images[0];
	// setInterval(function() {
	// 	drawFrame(px);
	// }, 1000/framesPerSecond);

	// process.nextTick(function() {
	// 	setInterval(function() {
	// 		frame++;
	// 		if (frame >= images.length) {
	// 			frame = 0;
	// 		}
	// 		px = images[frame];
	// 	}, framerate);
	// });



	var gifff = new gifFrames(gifName);

	var prevTime = Date.now();
	gifff.on('data', function(data) {
		var curTime = Date.now();
		// console.log(curTime - prevTime);
		px = JSON.parse(data);
		drawFrame(px);
		prevTime = curTime;
	})

	// setTimeout(gifff.pause, 1000);

	// setTimeout(gifff.play, 2000);

}


play();