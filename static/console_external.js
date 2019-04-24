YUI().use("node", function(Y) {

    //init
    var serviceName = "test online console service";
    var userName = "";
    var pasteBinLocation = null;
    var rooms = null;
    var cards = null;
    var room = null;

    //online stuff
    var socket = null;

    var InitOnline = function()
    {
        socket = io();
        
        socket.emit('new user', userName, pasteBinLocation);

        socket.on("send rooms", function(SrvRooms)
        {
            rooms = SrvRooms.rooms;
            cards = SrvRooms.cards;
            room = rooms[0];
            outputToConsoleColor("You just entered " + room.name, "white");
        });

        socket.on('message', function(Srvdata, SrvRoom) {
            if (SrvRoom == room.name || SrvRoom == "all")
                outputToConsole(Srvdata);
        });

        socket.on('message color', function(Srvdata, SrvRoom, SrvColor) {
            if (SrvRoom == room.name || SrvRoom == "all")
                outputToConsoleColor(Srvdata, SrvColor);
        });

        socket.on("break", function(SrvRoom){
            if (SrvRoom == room.name || SrvRoom == "all")
                NewLine();
        });

        socket.on("room description", function(users){
            DescribeRoom(users);
        })
    }
    
    

    //console stuff
    var COMMANDS = [
        {
            name: "login",
            handler: function(args)
            {
                if (userName == "")
                {
                    pasteBinLocation = args[0];
                    userName = args[1];
                    outputToConsole("Hello " + userName + ", welcome to " + serviceName + ", the world is being loaded, please be patient.");
                    InitOnline();
                }
                else
                {
                    outputToConsoleColor("You can't login again, sorry...", "red");
                }
            }
        },

        {
            name: "describe",
            handler: function(args)
            {
                if (rooms == null)
                {
                    outputToConsole("Rooms have not been loaded, if you've been waiting a lot, there might be an error :/");
                }
                else
                {
                    switch (args[0])
                    {
                        case "area":
                            socket.emit("command", {text: "describe area", metaData: null}, room);
                        break;
                    }
                }
            }
        },

        {
            name: "travel",
            handler: function(args)
            {
                if (rooms == null)
                {
                    outputToConsole("Rooms have not been loaded, if you've been waiting a lot, there might be an error :/");
                }
                else
                {
                    Travel(args[0]);
                    socket.emit('command', {text: "travel", metaData: null}, room);
                }
            }
        },

        {
            name: "roll",
            handler: function(args)
            {
                if (rooms == null)
                {
                    outputToConsole("Rooms have not been loaded, if you've been waiting a lot, there might be an error :/");
                }
                else
                {
                    var number = args[0];
                    socket.emit('command', {text: "roll", metaData: [userName, number]}, room.name, number);
                }
            }
        },

        {
            name: "draw",
            handler: function(args)
            {
                if (rooms == null)
                {
                    outputToConsole("Rooms have not been loaded, if you've been waiting a lot, there might be an error :/");
                }
                else
                {
                    var card = cards[Math.floor(Math.random()*cards.length)];
                    socket.emit('command', {text: "draw card", metaData: [userName, card]}, room.name);
                }
            }
        },

        {
            name: "help",
            handler: function() {
                outputToConsoleColor("I swear I'll write a help section...", "cyan");
                outputToConsoleColor("type login plus your name to login", "cyan");

            }
        }
    ];

    function processCommand() {
        var inField = Y.one("#in");
        var input = inField.get("value");
        var parts = input.replace(/\s+/g, " ").split(" ");
        var command = parts[0];
        var args = parts.length > 1 ? parts.slice(1, parts.length) : [];

        inField.set("value", "");

        for (var i = 0; i < COMMANDS.length; i++) {
            if (command === COMMANDS[i].name) {
                COMMANDS[i].handler(args);
                return;
            }
        }

        if (userName != "")
            socket.emit('message', input, room.name);
        else
            outputToConsole("you need to login first");

    }

    //Console
    function outputToConsole(text) {
        var p = Y.Node.create("<p>" + text + "</p>");
        Y.one("#out").append(p);
        p.scrollIntoView();
    }

    function outputToConsoleColor(text, col) {
        var p = Y.Node.create('<p style="color:'+col+';">' + text + "</p>");
        Y.one("#out").append(p);
        p.scrollIntoView();
    }

    function NewLine() {
        var p = Y.Node.create("<br>");
        Y.one("#out").append(p);
        p.scrollIntoView();
    }

    Y.on("domready", function(e) {
        Y.one("body").setStyle("paddingBottom", Y.one("#in").get("offsetHeight"));
        Y.one("#in").on("keydown", function(e) {
            if (e.charCode === 13) {
                processCommand();
            }
        });
    });



    //internal stuff
    var Travel = function(direction)
    {
        if (room[direction] == null)
        {
            outputToConsoleColor("Unfortunately, there's nothing going " + direction + " from here.", "white");
            NewLine();
        }
        else
        {
            outputToConsoleColor("Your journey is not too long.", "white");

            rooms.forEach(function(tRoom)
            {
                if (tRoom.name == room[direction])
                    room = tRoom;        
            });
            
            outputToConsoleColor("You just entered " + room.name, "white");
            NewLine();
        }
    }

    var DescribeRoom = function(users)
    {
        NewLine()

        outputToConsoleColor("["+room.name+"]", "cyan");

        outputToConsoleColor(room.description, "white");
        
        if (room.north != null)
            outputToConsoleColor("North of this is " + room.north, "white");

        if (room.south != null)
            outputToConsoleColor("South of this is " + room.south, "white");

        if (room.west != null)
            outputToConsoleColor("West of this is " + room.west, "white");

        if (room.east != null)
            outputToConsoleColor("East of this is " + room.east, "white");

        users.forEach(function(user){
            outputToConsoleColor(user.name + " is here.", "purple");
        });

        NewLine();
    }

});