YUI().use("node", function(Y) {

    //init
    var serviceName = "test online console service";
    var userName = "";
    var room = null;

    //online stuff
    var socket = null;

    var InitOnline = function()
    {
        socket = io();
        
        socket.emit('new user', userName);

        socket.on('set room', function(SrvRoom){
            room = SrvRoom;
            outputToConsoleColor("You just entered " + room.name, "white");
            NewLine();
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
                    userName = args[0];
                    outputToConsole("Hello " + userName + ", welcome to " + serviceName);
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
                switch (args[0])
                {
                    case "area":
                        socket.emit("command", {text: "describe room", metaData: room.name});
                    break;
                }
            }
        },

        {
            name: "travel",
            handler: function(args)
            {
                socket.emit('command', {text: "travel", metaData: args[0]}, room.name);
            }
        },

        {
            name: "roll",
            handler: function(args)
            {
                var number = args[0];
                socket.emit('command', {text: "roll", metaData: [userName, number]}, room.name, number);
            }
        },

        {
            name: "draw",
            handler: function(args)
            {
                socket.emit('command', {text: "draw card", metaData: userName}, room.name);
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
});