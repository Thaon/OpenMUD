// Dependencies
var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');
var PastebinAPI = require('pastebin-js');
var app = express();
var server = http.Server(app);
var io = socketIO(server);
var PORT = process.env.PORT || 5000;
app.set('port', PORT);
app.use('/static', express.static(__dirname + '/static'));
// Routing
app.get('/', function(request, response) {
  response.sendFile(path.join(__dirname, '/static/index.html'));
});
// Starts the server.
server.listen(PORT, function() {
  console.log('Starting server on ' + PORT);
});

//server specific code
var users = [];

function DescribeRoom(room, socket)
{
	tUsers = [];
	users.forEach(function(user){
	    if (user.roomName == room.name)
	    {
	        tUsers.push(user);
	    }
	});
	socket.emit("room description", tUsers);
}

var SetUserRoomName = function(socketId, roomName)
{
	users.forEach(function(user){
		if (user.id == socketId)
			user.roomName = roomName;
	});
}

var SetUserRoom = function(socket, roomName)
{
	SetUserRoomName(socket.id, roomName);
	socket.broadcast.emit("message color", "Somebody just entered the area...", roomName, "grey");
}

//cards
var DrawCard = function(socket, userName, card, roomName)
{
	io.sockets.emit("message color", userName + " just drew the " + card.title +" card, it reads:", roomName, "yellow");
	io.sockets.emit("message color", card.content, roomName, "yellow");
	io.sockets.emit("break", roomName);
}

//-----------------------------------------------------------------------------------------------------------------------

// Add the WebSocket handlers
io.on('connection', function(socket) {
	socket.on('new user', function(userName, pastebinValue)
	{
	    //send rooms and set firt one
	    //get pastebin stuff
		var pastebin = new PastebinAPI();

		pastebin
		  .getPaste(pastebinValue)
		  .then(function (data) {
		    // data contains the raw paste
		    var jsonData =JSON.parse(data);

		    users.push({id: socket.id, name: userName, roomName: jsonData.rooms[0].name});
		    socket.emit("send rooms", jsonData);

		    //notify world
		    socket.broadcast.emit('message', 'Hey, ' + userName + ' was just born in the world.', "all");
		    socket.emit("break", "all");

		    //debug
		    console.clear();
		    console.log("now the following users are connected:");
		    users.forEach(function(element)
		    {
		    	console.log(element.name + " - " + element.id);
		    });
		  })
		  .fail(function (err) {
		    // Something went wrong
		    console.log(err);
		  })
	});

	socket.on('message', function(message, roomName){
		var user = null;
		users.forEach(function(element)
	    {
	    	if (element.id == socket.id)
	    	{
	    		user = element;
	    	}
	    });
	    if (user == null)
	    	return;
		io.sockets.emit('message', user.name + ' : ' + message, roomName);
	});

	socket.on('command', function(command, room){
		switch(command.text)
		{
			case "describe area":
				DescribeRoom(room, socket);
			break;

			case "travel":
				SetUserRoom(socket, room.name);
			break;

			case "roll":
				io.sockets.emit("message color", command.metaData[0] + " Rolled a d"+ command.metaData[1] +" with the result of: " + Math.round(Math.random() * parseInt(command.metaData[1]), 10), room, "yellow");
				io.sockets.emit("break", room);
			break;

			case "draw card":
				DrawCard(socket, command.metaData[0], command.metaData[1], room);
			break;
		}
	});

	socket.on('disconnect', function(){
		console.log("Somebody disconnected: " + socket.id);
		var tUser = null;
		users.forEach(function(element)
	    {
	    	if (element.id == socket.id)
	    	{
	    		tUser = element;
	    	}
	    });

	    if (tUser == null)
	    {
	    	return;
	    }

		var disconnectedUser = tUser.name;
		users.pop(tUser);
		io.sockets.emit('message color', disconnectedUser + " just left this world, what a pity", "all", "darkred");

		//debug
	    console.clear();
	    console.log("now the following users are connected:");
	    users.forEach(function(element)
	    {
	    	console.log(element.name + " - " + element.id);
	    });
	});
});

// setInterval(function() {
//   io.sockets.emit('message', 'hi!');
// }, 1000);
