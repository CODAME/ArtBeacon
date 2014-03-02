#!/usr/bin/env node

var async = require('async')
  , opts = require("nomnom").parse()
  , validator = require('validator')
  , gifFrames = require('./gif-frames'),
  sys = require("util"),
  url = require("url"),
  qs = require("querystring");


var OPC = new require('./opc')
var client = new OPC('localhost', 7890);

//default asset index
var currentAsset = 0;

//create a http server to listen for the asset variable
var http = require('http');
http.createServer(function (req, res) {
	if(req.method=="GET") {
	  var variables = url.parse(req.url, true).query;
	  var pathname = url.parse(req.url).pathname;
	 }
  res.writeHead(200, {'Content-Type': 'text/plain'});
  if (variables['asset_id'])
  {
  	currentAsset = parseInt(variables['asset_id']);
  	console.log('--------------------using asset #' + currentAsset);
  }
  res.end('Hello World\n' + variables['asset_id']);
}).listen(1337, '172.16.2.149');

var brightness = 0.3;
var framesPerSecond = 10;

var pixels = [];

//create array to store asset urls
var assets = opts._;

//add the default image at index 0
assets.unshift('http://24.media.tumblr.com/tumblr_madr3yubUn1qiq4cjo1_500.gif');

//add the passed asset urls to the assets array
for(var a = 0; a<assets.length; a++)
{
	console.log(a + ': ' + assets[a]);
	assets[a] = assets[a] || './codameAsset' + a + '.gif';
	if (!validator.isURL(assets[a])) {
		assets[a] = __dirname + "/" + assets[a];
	}
}

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

	//show current asset
	var handler = function(index) {
		return function(data) {
			if (currentAsset == index)
			{
				var curTime = Date.now();
				// console.log(curTime - prevTime);
				px = JSON.parse(data);
				drawFrame(px);
				prevTime = curTime;
			}
		}
	}

	//loop through the asset array and find the current one
	for(var b = 0; b<assets.length; b++)
	{
    	console.log(b + ': ' + assets[b]);
		var gifff = new gifFrames(assets[b]);
		var prevTime = Date.now();
		gifff.on('data', handler(b));
	}

}


play();