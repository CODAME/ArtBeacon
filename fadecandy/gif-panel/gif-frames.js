
var fs = require('fs')
  , gm = require('gm')
  , PNG = require('pngjs').PNG
  , async = require('async')
  , validator = require('validator')
  , tmp = require('tmp');

var getter = require('http-get');

var imageMagick = gm.subClass({ imageMagick: true });
tmp.setGracefulCleanup();



var Readable = require('stream').Readable;
var util = require("util");
var events = require("events");

function GIF(filename) {
    Readable.call(this);

    // console.log(filename);

    this._filename = filename;
    this._isReady = false;
    this._currentFrameIndex = -1;
    this._currentFrame = null;
    this._frames = [];
    this._frameRate = 250;
    this._interval = null;
    this._isStale = true;
    this.init(this.play.bind(this));
}

util.inherits(GIF, Readable);

GIF.prototype._read = function() {

	return this.push('');

    // this.push(this._currentFrame ? JSON.parse(this._currentFrame) : null)
    if (this._isReady && this._isStale && this._frames.length > 0 && this._currentFrame) {
    	// console.log(this._frames[this._currentFrame]);
    	this.push(JSON.stringify(this._currentFrame));
    	this._isStale = false;
    	console.log("was stale");
    }
    else {
    	this.push('');
    }
    // else {
    // 	this.push(null);
    // }
}


GIF.prototype.init = function(cb) {
	console.log ("FILE NAME");
	console.log(this._filename);
	var self = this;


	if (validator.isURL(this._filename)) {
		tmp.tmpName(function(tmpErr, path){
			if (tmpErr) return cb(tmpErr);

			console.log("URL!");
			var options = {url: self._filename};
			getter.get(options, path, function (error, result) {
			    if (error) {
			        console.error(error);
			    } else {
			        console.log('File downloaded at: ' + result.file);
			        self._filename = result.file;
			        self.init(cb);
			    }
			});


		});



	}
	else {
		GIF.frames(self._filename, function(err, frames) {
			if (err) throw err;
			GIF.frameRate(self._filename, function(e, rate) {
				if (e) rate = 150;
				self._frames = frames;
				self._frameRate = rate;
				self._isReady = true;
				cb();
			});
		});

	}

}


GIF.prototype.advanceFrame = function() {

	this._currentFrameIndex++;
	if (this._currentFrameIndex >= this._frames.length) {
		this._currentFrameIndex = 0;
	}
	this._currentFrame = this._frames[this._currentFrameIndex];
	// this.read(0);

	// console.log("advanced frame " + this._frameRate);
	this.push(JSON.stringify(this._currentFrame));
	this._isStale = true;

	// console.log(this._frames[this._currentFrameIndex]);

	// console.log(this._currentFrameIndex);
}

GIF.prototype.pause = function() {
	clearInterval(this._interval);
}

GIF.prototype.play = function() {
	this.advanceFrame();
	this._interval = setInterval(this.advanceFrame.bind(this), this._frameRate);

    // this.push(this._currentFrame ? JSON.parse(this._currentFrame) : null)
    // if (this._isReady) {
    // 	this.push(JSON.parse(this._frames[this._currentFrame]));
    // }
    // else {
    // 	this.push(null);
    // }
}


GIF.frames = function(gifName, cb) {

	tmp.dir(function(tmpErr, tmpDir){
		if (tmpErr) return cb(tmpErr);

		var imgFrames = [];

		imageMagick(gifName).resize(16, 32, "!").write(tmpDir + '/frames.png', function(e) {
			var files = fs.readdirSync(tmpDir);

			async.each(files, function(file, next) {
				if (file.indexOf('.png') === -1) {
					return next();
				}

				fs.createReadStream(tmpDir + '/' + file)
				    .pipe(new PNG({
				        filterType: 4
				    }))
				    .on('parsed', function() {
				    	var px = []
				        for (var y = 0; y < this.height; y++) {
				            for (var x = 0; x < this.width; x++) {
				                var idx = (this.width * y + x) << 2;
				                px.push([this.data[idx], this.data[idx+1], this.data[idx+2]])

				            }
				        }
				        imgFrames.push(px);
				        next();
				    });

			}, function(err) {
				cb(err, imgFrames);
			});

		});

	});

};

GIF.frameRate = function(gifName, cb) {
	gm(gifName).identify(function(err, data) {
		console.log(data);
		if (err) {
			return cb(err);
		}
		try {
			// console.log(data);
			frameDelay = parseInt(data.Delay, 10) * 10;
			cb(null, frameDelay);
		}
		catch (parseErr) {
			cb(parseErr);
		}
	});
};


module.exports = GIF;

// module.exports.stream = function(gifName, cb) {}