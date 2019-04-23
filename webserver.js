var http = require('http').createServer(handler); //require http server, and create server with function handler()
var fs = require('fs'); //require filesystem module
var io = require('socket.io')(http) // require socket.io module and pass the http object

var Gpio = require('onoff').Gpio; // include onoff to interact with the GPIO
var LED = new Gpio(4, 'out'); // use GPIO pin 4 as output
var pushButton = new Gpio(17, 'in', 'both'); // use GPIO pin 17 as input, and 'both' button presses and releases should be handled

http.listen(process.env.PORT); //listen to port 8080

function handler (req, res) { //create server
  fs.readFile(__dirname + '/public/index.html', function(err, data) { //read file index.html in public folder
    if (err) {
      res.writeHead(404, {'Content-Type': 'text/html'}); //display 404 on error
      return res.end("404 Not Found");
    } 
    res.writeHead(200, {'Content-Type': 'text/html'}); //write HTML
    res.write(data); //write data from index.html
    return res.end();
  });
}

io.sockets.on('connection', function (socket) {
	var lightvalue = 0; //static variable for current status
	
	pushButton.watch(function (err, value) {
		if (err) {
			console.error('There was an error', err);
			return;
		}
		lightvalue = value;
		socket.emit('light', lightvalue); // send button status to client PROF
	});
	socket.on("light", function(data) { // get light switch status from client BRAP
		lightvalue = data;
		if (lightvalue != LED.readSync()) { // only change LED if status has changed
			console.log(lightvalue);
			LED.writeSync(lightvalue); // turn LED on or off
		}
	});
});

process.on('SIGINT', function () {
	LED.writeSync(0); // Turn led off
	LED.unexport(); // Unexport LED GPIO to free resources
	pushButton.unexport(); // Unexport button GPIO to free resources
	process.exit(); // exit completely
});
