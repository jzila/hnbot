var static = require("node-static"), http = require("http"), util = require("util");

var port = process.env.PORT;

var fileServer = new static.Server("./static");

var makeResponseCallback =
    function(req, res) {
        return function(err, result) {
            if (err) {
                console.error('Error serving %s - %s', req.url, err.message);
                res.writeHead(err.status, err.headers);
                res.end();
            } else {
                console.log('%s - %s', req.url, res.message); 
            }
        };
    };

http.createServer(function(req, res) {
    req.addListener('end', function() {
        fileServer.serve(req, res, makeResponseCallback(req, res));
    }).resume();
}).listen(port);
