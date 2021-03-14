const http = require('http');
const socketio = require('socket.io');
const redis = require('async-redis');

const GameRoom = require('./GameRoom.js');
const Player = require('./Player.js');
const Message = require('./Message.js');

var players = {}; // map from player id -> player object
var gameRooms = []; // array of game rooms (index is the)
var connections = [];
var gameHistory = {}; // map from roomId to array of messages
var privateMessages = {}; // map from privateRoomId to array of messages

const redisClient = redis.createClient();

const app = http.createServer();
app.listen(3001, () => console.log('Listening at ', 3001));

// Do the Socket.IO magic:
const cors = {
    cors: {
        origin: 'http://localhost:3000',
        credentials: true,
        transport: ['websocket']
    }
};
const io = socketio(http, cors).listen(app);
io.sockets.on('connection', function (socket) {
    // This callback runs when a new Socket.IO connection is established.
    connections.push(socket);

    socket.on('message_to_server', function (data) {
        var room = gameRooms[data['room']];
        var messageText = data['message'];
        var sentAt = data['sent_at'];
        var player = players[socket.id];

        console.log(
            player.playerName +
                ': ' +
                messageText +
                ' in room ' +
                room.name +
                ' at ' +
                sentAt
        );

        if (!gameHistory.hasOwnProperty(room.id)) {
            // create new game history
            gameHistory[room.id] = [];
        }

        // add the message to the history
        var message = new Message(player, messageText, room.id, sentAt);

        var history = gameHistory[room.id];
        history.push(message);

        io.sockets
            .in(room.name)
            .emit('message_to_client', { game_history: history });
    });

    socket.on('private_message_to_server', function (data) {
        var room = gameRooms[data['room']];
        var messageText = data['message'];
        var sentAt = data['sent_at'];
        var toPlayerId = data['to_player_id'];
        var toPlayer = players[toPlayerId];
        var player = players[socket.id];

        console.log(
            player.playerName +
                ': ' +
                messageText +
                ' in room ' +
                room.name +
                ' at ' +
                sentAt +
                ' to player ' +
                toPlayerId
        );
        var pairId = getUniquePairId(player, toPlayer);
        console.log(pairId);

        if (!privateMessages.hasOwnProperty(pairId)) {
            // create new game history
            privateMessages[pairId] = [];
        }

        // add the message to the history
        var message = new Message(player, messageText, room.id, sentAt);
        message.private = true;
        message.toPlayer = toPlayer;

        if (Player.Player.playerInRoom(room, toPlayer)) {
            var socketOfPlayerToMessage = findId(connections, toPlayerId);
            console.log(toPlayerId);
            console.log(connections);
            var history = privateMessages[pairId];
            history.push(message);

            socketOfPlayerToMessage.emit('private_message_to_client', {
                game_history: history
            });
            socket.emit('private_message_to_client', { game_history: history });
        } else {
            console.log('unable to message player ' + message.toPlayerId);
        }
    });

    // Player input her/his name and press send button
    socket.on('send_player_name_to_server', function (data, callback) {
        const playerName = data['playerName'];

        // Playername is empty
        if (!playerName) {
            callback({
                success: false,
                message: 'Player name cannot be empty'
            });
            return;
        }
        socket.playerName = playerName;

        // Check player is already exists
        const oldPlayerId = Player.isPlayerAlreadyExists(playerName, players);

        // Player not exists yet, create it
        if (oldPlayerId === false) {
            const player = new Player(socket.id, socket.playerName);
            players[player.id] = player;
            console.log(playerName + ' joined the server with id ' + socket.id);
            callback({ success: true, player: player });

            // Send update to all players
            io.sockets.emit('update_players', players);

            // send game room list to the newly registered client
            socket.emit('update_game_rooms', { rooms: gameRooms });

            return;
        }

        // if playerName already exists, then reset the id to the socket id
        const oldPlayer = players[oldPlayerId];
        const player = oldPlayer;
        player.id = socket.id;
        players[player.id] = player;

        // Delete the old player
        delete players.oldPlayerId;

        // Update players (like observer)
        for (var i = 0; i < gameRooms.length; i++) {
            var room = gameRooms[i];

            // Update players in room
            for (var i = 0; i < room.players.length; i++) {
                var roomPlayer = room.players[i];
                if (roomPlayer.playerName === playerName) {
                    roomPlayer.id = player.id;
                }
            }

            // Update banned players in room
            for (var i = 0; i < room.bannedPlayers.length; i++) {
                var roomPlayer = room.bannedPlayers[i];
                if (roomPlayer.playerName === playerName) {
                    roomPlayer.id = player.id;
                }
            }
        }

        console.log(playerName + ' rejoined the server with id ' + socket.id);

        // If joined to room
        if (player.room) {
            const room = gameRooms.find(
                (room) => room.roomCode === player.room
            );
            callback({ success: true, player: player, room: room });
        } else {
            callback({ success: true, player: player });
        }

        // Send update to all players
        io.sockets.emit('update_players', players);

        // send game room list to the newly registered client
        socket.emit('update_game_rooms', { rooms: gameRooms });
    });

    // Remove socket from connection, if there is a playerName
    socket.on('disconnect', function (data) {
        const player = players[socket.id];

        // Remove this player from all other game rooms' player lists
        if (typeof player !== 'undefined') {
            player.removeFromAllRooms(gameRooms);
        }

        // Remove socket connection
        connections.splice(connections.indexOf(socket), 1);
        console.log(
            socket.id,
            'is disconnected: ',
            connections.length,
            ' connections remaining'
        );

        // send update to all players
        io.sockets.emit('update_players', players);
        io.sockets.emit('update_game_rooms', { rooms: gameRooms });
    });

    socket.on('client_player_typing', function (data) {
        var playerName = data['playerName'];
        var roomId = data['room_id'];
        var room = gameRooms[roomId];

        io.sockets
            .in(socket.room)
            .emit('server_player_typing', { playerName: playerName });
    });

    socket.on('request_player_info', function (data) {
        var currentPlayer = players[socket.id];

        var createdRooms = [];
        var bannedFromRooms = [];
        var numMessagesSent = 0;
        for (var i = 0; i < gameRooms.length; i++) {
            var room = gameRooms[i];
            if (room.owner.id === currentPlayer.id) {
                createdRooms.push(room.name);
            }

            for (var j = 0; j < room.bannedPlayers.length; j++) {
                var player = room.bannedPlayers[j];
                if (player.id === currentPlayer.id) {
                    bannedFromRooms.push(room.name);
                }
            }

            if (gameHistory.hasOwnProperty(room.id)) {
                var messages = gameHistory[room.id];
                for (var j = 0; j < messages.length; j++) {
                    var message = messages[j];
                    if (message.player.id === currentPlayer.id) {
                        numMessagesSent++;
                    }
                }
            }
        }

        socket.emit('recieved_player_info', {
            id: currentPlayer.id,
            playerName: currentPlayer.playerName,
            created_rooms: createdRooms,
            banned_rooms: bannedFromRooms,
            num_messages_sent: numMessagesSent
        });
    });

    // Create room and join code (Finished)
    socket.on('create_game_room_to_server', function (data, callback) {
        // Make 5 characters room code
        const roomCode = GameRoom.makeRoomCode(5);
        const roomId = gameRooms.length;
        const room = new GameRoom(roomId, roomCode);

        // Create game history
        if (!gameHistory.hasOwnProperty(room.roomId)) {
            gameHistory[room.id] = [];
        }

        // Join to room
        socket.room = room.roomCode;
        gameRooms.push(room);
        socket.join(socket.room);

        callback({ success: true, room: room });
        console.log('Room created: ', room);

        // Update to clients
        io.sockets
            .in(socket.room)
            .emit('update_room_to_client', { success: true, room: room });
    });

    // Join to game room
    socket.on('join_game_room_to_server', function (data, callback) {
        const roomCode = data['roomCode'];
        const room = gameRooms.find((room) => room.roomCode === roomCode);
        const player = players[socket.id];

        console.log(player, ' try to join room ', room);

        // If player not found
        if (!player) {
            callback({
                success: false,
                code: 400,
                message: 'A játékost nem sikerült beazonosítani'
            });
            return;
        }

        // If room ID is valid, then try to join the room
        if (!room) {
            callback({
                success: false,
                code: 401,
                message: 'A szoba nem található'
            });
            return;
        }

        // Check player is banned
        if (player.isBannedFromRoom(room)) {
            callback({
                success: false,
                code: 402,
                message: 'Ki lettél dobva a játékból'
            });
            return;
        }

        // Check if player already in the room
        if (player.isPlayerInRoom(room)) {
            callback({
                success: false,
                code: 403,
                message: 'Már csatlakoztál a szobához'
            });
            return;
        }

        // Remove player from all other game rooms first
        player.removeFromAllRooms(gameRooms);

        // Now join
        socket.room = room.roomCode;
        socket.join(socket.room);

        room.addPlayer(player);
        player.room = socket.room;

        console.log(socket.playerName + ' joined game room ' + socket.room);

        callback({ success: true, room: room, player: player });

        io.sockets
            .in(socket.room)
            .emit('update_room_to_client', { success: true, room: room });
    });

    // Player status (ready for game or not)
    socket.on('player_ready_to_server', function (data, callback) {
        const player = players[socket.id];
        const ready = data['ready'];

        console.log(player, ' try to set ready for');

        // If player not found
        if (!player) {
            callback({
                success: false,
                code: 400,
                message: 'A játékost nem sikerült beazonosítani'
            });
            return;
        }

        // Set status in player object
        player.setReady(ready);

        // Set player in room
        const room = player.getRoom(gameRooms);
        room.setPlayer(player);
        room.checkEverybodyIn();

        callback({ success: true, room: room, player: player });

        io.sockets.in(socket.room).emit('update_room_to_client', {
            success: true,
            room: room
        });
    });

    socket.on('get_fact_to_server', async function (data, callback) {
        const factId = await redisClient.randomkey();
        const fact = await redisClient.get(factId);

        console.log('Fact queried ', fact);

        // Send to all clients
        io.sockets.in(socket.room).emit('send_fact_to_client', { fact: fact });
    });

    socket.on('kick_player', function (data) {
        var roomId = data['roomId'];
        var playerId = data['playerId'];

        var room = gameRooms[roomId];
        var playerToKick = players[playerId];
        var currentPlayer = players[socket.id];

        // if currentPlayer is allowed to kick the playerToKick, then kick
        if (room.owner.id !== currentPlayer.id) {
            console.log('Player not allowed to kick');
            return;
        }

        room.removePlayer(playerToKick);
        var socketOfPlayerToKick = findId(connections, playerToKick.id);
        socketOfPlayerToKick.leave(socketOfPlayerToKick.room);

        io.sockets
            .in(socket.room)
            .emit('update_active_players_to_client', { room: room });
        socketOfPlayerToKick.emit('update_active_players_to_client', {
            room: room
        });

        io.sockets.emit('update_game_rooms_to_client', { rooms: gameRooms });
    });

    socket.on('ban_player', function (data, callback) {
        var roomId = data['roomId'];
        var playerId = data['playerId'];

        var room = gameRooms[roomId];
        var playerToBan = players[playerId];
        var currentPlayer = players[socket.id];

        // if currentPlayer is allowed to ban the playerToBan, then ban
        if (room.owner.id === currentPlayer.id) {
            console.log(
                'banning player ' +
                    playerToBan.playerName +
                    ' with id ' +
                    playerToBan.id
            );
            // also have to kick player
            room.removePlayer(playerToBan);
            room.banPlayer(playerToBan);
            var socketOfPlayerToBan = find(connections, playerToBan.id);
            socketOfPlayerToBan.leave(socketOfPlayerToBan.room);
            console.log(room);
            callback({ success: true });

            io.sockets
                .in(socket.room)
                .emit('update_active_players_to_client', { room: room });
            io.sockets
                .in(socket.room)
                .emit('update_banned_players_to_client', { room: room });

            // TEST this
            console.log(socketOfPlayerToBan);
            socketOfPlayerToBan.emit('player_banned', { room: room });
            // socketOfPlayerToBan.emit('update_active_players', { room: room } );
            // socketOfPlayerToBan.emit('update_banned_players', { room: room } );

            io.sockets.emit('update_game_rooms', { rooms: gameRooms });
        } else {
            callback({
                success: false,
                message: 'You must own the room to ban a player'
            });
        }
    });
});

Array.prototype.findId = function (id) {
    for (var i = 0; i < this.length; i++) {
        if (this[i].id === id) {
            return this[i];
        }
    }
};

function getUniquePairId(firstPlayer, secondPlayer) {
    var firstPlayername = firstPlayer.playerName;
    var secondPlayername = secondPlayer.playerName;
    if (firstPlayername.localeCompare(secondPlayername) === -1) {
        // firstPlayername is "<" (before) secondPlayername
        return firstPlayername + secondPlayername;
    } else if (firstPlayername.localeCompare(secondPlayername) === 1) {
        // firstPlayername is ">" (after) secondPlayername
        return secondPlayername + firstPlayername;
    } else {
        // ids are equal, should throw an error
    }
}
