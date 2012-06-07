var connect    = require('connect'),
    Url        = require('url'),
    util       = require('util')

var PORT = 2400

var alldat = [
  {name:'Mark', value: 10},
  {name:'Joe', value: 12.3},
  {name:'Ben', value: 8.6}
]

var app = connect()
  .use(connect.staticCache())
  .use(connect.static(__dirname))
  .use(function(request, response) {
    var url = Url.parse(request.url, true)
    request.query = url.query
    util.log('request: '+url.pathname)

    if (request.method == "OPTIONS") {
      handleOptions(request, response)
    } else if (url.pathname == '/data/maingrid.json') {
      var maingrid = {
        the_data: alldat
      }
      response.end(JSON.stringify(maingrid)+"\n")
    } else {
      util.log('unhandled request: '+request.url)
      return false
    }
  })
  .listen(PORT)

var io = require('socket.io').listen(app);
io.configure(function() {
  // These production settings -- see https://github.com/LearnBoost/Socket.IO/wiki/Configuring-Socket.IO
  io.enable('browser client minification');  // send minified client
  io.enable('browser client etag');          // apply etag caching logic based on version number
  io.enable('browser client gzip');          // gzip the file
  io.set('log level', 1);                    // reduce logging
  io.set('transports', [                     // enable all transports (optional if you want flashsocket)
      'websocket'
    , 'flashsocket'
    , 'htmlfile'
    , 'xhr-polling'
    , 'jsonp-polling'
  ]);
})

io.sockets.on('connection', socketConnect)

var RTS_PERIOD_SECS = 1

function socketConnect(socket){
  util.log('socketConnect')
  var pushes = null
  socket.on('track', function(newTrackSpec){
    var func = function() {
      alldat.forEach(function(d){ d.value += Math.random()*.10 - .05 })
      socket.volatile.emit('rtstats',{success:true, dat: alldat})
    }
    pushes = setInterval(func, 1000 * RTS_PERIOD_SECS)
    func()
  })
  // TODO: on stop track, or if connection is ended, pushes.clearInterval()
}

// Options request is sent by the browser to probe if CORS requests are allowed or not.
function handleOptions(request, response) {
  util.log('handleOptions')
  response.writeHead(200, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Overwrite, Destination, Content-Type, Depth, User-Agent, X-File-Size, X-Requested-With, If-Modified-Since, X-File-Name, Cache-Control',
    'Access-Control-Allow-Methods': 'OPTIONS, GET, POST'
  })
  response.end()
}

util.log("Listening on " + PORT)
