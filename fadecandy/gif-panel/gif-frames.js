
var fs = require('fs')
  , gm = require('gm')
  , PNG = require('pngjs').PNG
  , async = require('async')
  , tmp = require('tmp');

var imageMagick = gm.subClass({ imageMagick: true });
tmp.setGracefulCleanup();



module.exports.frames = function frames(gifName, cb) {

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

module.exports.frameRate = function frameRate(gifName, cb) {
	gm(gifName).identify(function(err, data) {
		if (err) {
			return cb(err);
		}
		try {
			frameDelay = parseInt(data.Delay, 10);
			cb(null, frameDelay);
		}
		catch (parseErr) {
			cb(parseErr);
		}
	});
};


module.exports.stream = function(gifName, cb) {}