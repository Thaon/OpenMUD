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

//rooms
var rooms = [];

//cards
var cards = [];

//get pastebin stuff
var pastebin = new PastebinAPI();

pastebin
  .getPaste('ghb1FQx0')
  .then(function (data) {
    // data contains the raw paste
    var jsonData =JSON.parse(data);
    rooms = jsonData.rooms;
    cards = jsonData.cards;
    //console.log(jsonData);
    console.log("Loaded PasteBin data!");
  })
  .fail(function (err) {
    // Something went wrong
    console.log(err);
  })

//game specific functions
var DescribeRoom = function(roomName, socket)
{
	rooms.forEach(function(room)
	{
		if (room.name == roomName)
		{
			socket.emit("break", "all");
			socket.emit("message color", "["+room.name+"]", "all", "cyan");

			socket.emit("message color", room.description, "all", "white");
			
			if (room.north != null)
				socket.emit("message color", "North of this is " + room.north, "all", "white");

			if (room.south != null)
				socket.emit("message color", "South of this is " + room.south, "all", "white");

			if (room.west != null)
				socket.emit("message color", "West of this is " + room.west, "all", "white");

			if (room.east != null)
				socket.emit("message color", "East of this is " + room.east, "all", "white");

			users.forEach(function(user){
				if (user.roomName == room.name)
				{
					socket.emit("message color", user.name + " is here.", "all", "purple");
				}
			});
			socket.emit("break", "all");
		}
	});
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
	var currentRoom = null;
	rooms.forEach(function(tRoom)
	{
		if (tRoom.name == roomName)
		{
			currentRoom = tRoom;
		}
	});

	socket.emit("set room", currentRoom);
	SetUserRoomName(socket.id, currentRoom.name);
	socket.broadcast.emit("message color", "Somebody just entered the area...", currentRoom.name, "grey");
}

var Travel = function(direction, roomName, socket)
{
	var currentRoom = null;
	rooms.forEach(function(tRoom)
	{
		if (tRoom.name == roomName)
		{
			currentRoom = tRoom;
		}
	});

	if (currentRoom == null)
	{
		socket.emit("message color", "Uh oh, there seems to be a problem with your travel documents...", "all", "white");
		socket.emit("break", "all");
		return;
	}

	if (currentRoom[direction] == null)
	{
		socket.emit("message color", "Unfortunately, there's nothing going " + direction + " from here.", "all", "white");
		socket.emit("break", "all");
	}
	else
	{
		socket.emit("message color", "Your journey is not too long.", "all", "white");
		SetUserRoom(socket, currentRoom[direction]);
	}
}

//cards
var DrawCard = function(socket, userName, roomName)
{
	var card = cards[Math.floor(Math.random()*cards.length)];
	io.sockets.emit("message color", userName + " just drew the " + card.title +" card, it reads:", roomName, "yellow");
	io.sockets.emit("message color", card.content, roomName, "yellow");
	io.sockets.emit("break", roomName);
}

//-----------------------------------------------------------------------------------------------------------------------

// Add the WebSocket handlers
io.on('connection', function(socket) {
	socket.on('new user', function(userName, pastebinValue)
	{
	    users.push({id: socket.id, name: userName, roomName: rooms[0].name});

	    //send rooms and set first one
	    socket.emit('set room', rooms[0]);

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
			case "describe room":
				DescribeRoom(command.metaData, socket);
			break;

			case "travel":
				Travel(command.metaData, room, socket);
			break;

			case "roll":
				io.sockets.emit("message color", command.metaData[0] + " Rolled a d"+ command.metaData[1] +" with the result of: " + Math.round(Math.random() * parseInt(command.metaData[1]), 10), room, "yellow");
				io.sockets.emit("break", room);
			break;

			case "draw card":
				DrawCard(socket, command.metaData, room);
			break;
		}
	});

	socket.on('disconnect', function(){
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
		var disconnectedUser = user.name;
		users.pop(user);
		io.sockets.emit('message', disconnectedUser + " just died, what a pity", "all");
	});
});

// setInterval(function() {
//   io.sockets.emit('message', 'hi!');
// }, 1000);
