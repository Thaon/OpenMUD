YUI().use("node", function(Y) {

    pastInputs = [];
    pastInputsCounter = 0;

    //init
    var serviceName = "";
    var userName = "";
    var world = null;
    var rooms = null;
    var cards = null;
    var room = null;

    //messages
    var worldDescription = "";
    var serverRules = "";
    var sayMessage = "";
    var loginMessage = "";
    var logoutMessage = "";
    var enterRoomMessage = "";
    var otherPlayerEnterRoomMessage = "";
    var cannotTravelMessage = "";
    var finishedTravellingMessage = "";
    var roomsNotLoadedMessage = "";
    var loggingInMessage = "Loading World.";
    var loginErrorMessage = "Login first, please.";

    //online stuff
    var socket = null;

    var InitOnline = function()
    {
        socket.emit('new user', userName, world);

        socket.on("send rooms", function(SrvRooms)
        {
            //init vars
            rooms = SrvRooms.rooms;
            cards = SrvRooms.cards;
            room = rooms[0];

            //fetch messages
            serviceName = ReplaceStringVariables(SrvRooms.world_name);
            worldDescription = ReplaceStringVariables(SrvRooms.world_description);
            serverRules = SrvRooms.server_rules;
            sayMessage = ReplaceStringVariables(SrvRooms.players_speech_prefix);
            loginMessage = ReplaceStringVariables(SrvRooms.login_message);
            loginErrorMessage = ReplaceStringVariables(SrvRooms.login_error_message);
            logoutMessage = ReplaceStringVariables(SrvRooms.logout_message);
            enterRoomMessage = ReplaceStringVariables(SrvRooms.enter_room_message);
            otherPlayerEnterRoomMessage = ReplaceStringVariables(SrvRooms.other_player_enters_room_message);
            cannotTravelMessage = ReplaceStringVariables(SrvRooms.cannot_travel_message);
            finishedTravellingMessage = ReplaceStringVariables(SrvRooms.finished_travelling_message);
            roomsNotLoadedMessage = SrvRooms.rooms_not_loaded_message;


            //notify player
            outputToConsole(loginMessage);
            outputToConsoleColor(enterRoomMessage);
        });

        socket.on('message', function(SrvWorld, Srvdata, SrvRoom) {
            if (SrvWorld == world && (SrvRoom == room.name || SrvRoom == "all"))
                outputToConsole(sayMessage + Srvdata);
        });

        socket.on('message color', function(SrvWorld, Srvdata, SrvRoom, SrvColor) {
            if (SrvWorld == world && (SrvRoom == room.name || SrvRoom == "all"))
                outputToConsoleColor(sayMessage + Srvdata, SrvColor);
        });

        socket.on("break", function(SrvWorld, SrvRoom){
            if (SrvWorld == world && (SrvRoom == room.name || SrvRoom == "all"))
                NewLine();
        });

        socket.on("room description", function(users){
            DescribeRoom(users);
        });
    }
    
    

    //console stuff
    var COMMANDS = [
        {
            name: "login",
            handler: function(args)
            {
                if (userName == "")
                {
                    world = args[0];
                    userName = args[1];
                    var str;
                    
                    outputToConsole(loggingInMessage);
                    InitOnline();
                }
                else
                {
                    outputToConsoleColor(loginErrorMessage, "red");
                }
            }
        },

        {
            name: "describe",
            handler: function(args)
            {
                if (rooms == null)
                {
                    outputToConsole(roomsNotLoadedMessage);
                }
                else
                {
                    switch (args[0])
                    {
                        case "area":
                            socket.emit("command", {text: "describe area", metaData: null}, world, room);
                        break;

                        case "world":
                            outputToConsoleColor(worldDescription, "cyan");
                        break;

                        case "rules":
                            outputToConsoleColor(serverRules, "cyan");
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
                    outputToConsole(roomsNotLoadedMessage);
                }
                else
                {
                    Travel(args[0]);
                    socket.emit('command', {text: "travel", metaData: otherPlayerEnterRoomMessage}, world, room);
                }
            }
        },

        {
            name: "roll",
            handler: function(args)
            {
                if (rooms == null)
                {
                    outputToConsole(roomsNotLoadedMessage);
                }
                else
                {
                    var number = args[0];
                    socket.emit('command', {text: "roll", metaData: [userName, number]}, world, room.name);
                }
            }
        },

        {
            name: "draw",
            handler: function(args)
            {
                if (rooms == null)
                {
                    outputToConsole(roomsNotLoadedMessage);
                }
                else
                {
                    var card = cards[Math.floor(Math.random()*cards.length)];
                    socket.emit('command', {text: "draw card", metaData: [userName, card]}, world, room.name);
                }
            }
        },

        {
            name: "worlds",
            handler: function(args)
            {
                if (rooms == null)
                {
                    outputToConsole(roomsNotLoadedMessage);
                }
                else
                {
                    var number = args[0];
                    socket.emit('command', {text: "roll", metaData: [userName, number]}, world, room.name);
                }
            }
        },

        {
            name: "commands",
            handler: function() {
                outputToConsoleColor("Commands:", "gold");
                outputToConsoleColor("login + world ID + name, logs you into a world with the given name", "gold");
                outputToConsoleColor("travel + direction, travels in a direction", "gold");
                outputToConsoleColor("describe world, describes the world you inhabit", "gold");
                outputToConsoleColor("describe rules, describes the server rules, make sure you read them!", "gold");
                outputToConsoleColor("describe area, describes the area around you", "gold");
                outputToConsoleColor("roll + number, rolls a dice with that many faces", "gold");
                outputToConsoleColor("draw card, draws a card from the global deck for this world", "gold");
            }
        }
    ];

    function processCommand() {
        var inField = Y.one("#in");
        var input = inField.get("value");

        //commands backlog
        pastInputs.push(input);
        if (pastInputs.length > 100)
            pastInputs.shift();
        pastInputsCounter = pastInputs.length;4

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
            socket.emit('message', input, world, room.name);
        else
            outputToConsole(loginErrorMessage);

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

            if (e.charCode === 38) {
                if (pastInputsCounter > 0)
                {
                    pastInputsCounter--;
                    Y.one("#in").set("value", pastInputs[pastInputsCounter]);
                }
            }

            if (e.charCode === 40) {
                if (pastInputsCounter < pastInputs.length - 1)
                {
                    pastInputsCounter++;
                    Y.one("#in").set("value", pastInputs[pastInputsCounter]);
                }
            }
        });

        //get worlds list
        socket = io();

        socket.on("worlds description", function(worlds)
        {
            for (var i = worlds.length - 1; i >= 0; i--) {
                outputToConsoleColor(worlds[i], "gold");
            }
        });

        socket.emit("describe worlds");
    });



    //internal stuff
    var Travel = function(direction)
    {
        if (room[direction] == null)
        {
            outputToConsoleColor(cannotTravelMessage, "white");
            NewLine();
        }
        else
        {
            outputToConsoleColor(finishedTravellingMessage, "white");

            rooms.forEach(function(tRoom)
            {
                if (tRoom.name == room[direction])
                    room = tRoom;        
            });
            
            outputToConsoleColor(enterRoomMessage, "white");
            NewLine();
        }
    }

    var DescribeRoom = function(users)
    {
        NewLine()

        outputToConsoleColor("["+room.name+"]", "cyan");

        outputToConsoleColor(room.description, "white");
        
        if (room.north != null)
            outputToConsoleColor("North: " + room.north, "white");

        if (room.south != null)
            outputToConsoleColor("South: " + room.south, "white");

        if (room.west != null)
            outputToConsoleColor("West: " + room.west, "white");

        if (room.east != null)
            outputToConsoleColor("East: " + room.east, "white");

        usersInRoom = "";

        users.forEach(function(user){
            usersInRoom += "{" + user.name + "} ";
        });
        outputToConsoleColor(usersInRoom, "purple");

        NewLine();
    }


    function ReplaceStringVariables(originalString)
    {
        var str = originalString;
        str = str.replace("$p", userName);
        str = str.replace("$w", serviceName);
        str = str.replace("$r", room.name);
        return str;
    }
});