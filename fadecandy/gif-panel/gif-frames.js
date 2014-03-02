
var fs = require('fs')
  , gm = require('gm')
  , PNG = require('pngjs').PNG
  , async = require('async')
  , tmp = require('tmp');

var imageMagick = gm.subClass({ imageMagick: true });
tmp.setGracefulCleanup();



module.exports.frames = function(gifName, cb) {

	tmp.dir(function(tmpErr, TMP_DIR){
		if (tmpErr) return cb(tmpErr);

		var images = [];

		// try {
		// 	var files = fs.readdirSync(TMP_DIR);
		// 	files.forEach(function(f) {
		// 		fs.unlink(TMP_DIR + '/' + f);
		// 	});
		// 	fs.rmdirSync(TMP_DIR);
		// }
		// catch (err) {}
		// fs.mkdirSync(TMP_DIR);


		imageMagick(gifName).resize(16, 32, "!").write(TMP_DIR + '/frames.png', function(e) {
			var files = fs.readdirSync(TMP_DIR);

			async.each(files, function(file, next) {
				if (file.indexOf('.png') === -1) {
					return next();
				}

				fs.createReadStream(TMP_DIR + '/' + file)
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
				        images.push(px);
				        next();
				    });

			}, function(err) {
				cb(err, images);
			});

		});

	});

};

module.exports.frameRate = function(gifName, cb) {
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

