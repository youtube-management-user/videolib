
var fs          = require('fs'),
    http        = require('http');

http.createServer(function (req, res) {

    console.log(req.url);
    if( req.url == '/video.mp4'){

        res.writeHead(200,{
            'Content-Type'          : 'video/mp4',
            'Cache-Control'         : 'public',
            'Connection'            : 'keep-alive',
            'Content-Disposition'   : 'inline; filename=topgears.mp4;',
            'Content-Transfer-Encoding' : 'binary',
            'Transfer-Encoding'     : 'chunked'
        });

        fs.open('./videos/4/11.mp4', 'r', function(err, fd) {

            if (err) throw new Error('Could not open file');
            var position = 0;

            fs.stat(filename, read);
            fs.watchFile(filename, read.bind(null, null));

            function read(err, stat) {

                var delta = stat.size - position;
                if (delta <= 0) return;

                fs.read(fd, new Buffer(delta), 0, delta, position, function(err, bytes, buffer) {

                    console.log("err", err, "bytes", bytes, "position",position,"delta",delta);
                    res.write(buffer.toString('binary'));

                });

                position = stat.size;

            }

        });

    }

}).listen(1337);
console.log('Server running at http://127.0.0.1:1337/');
