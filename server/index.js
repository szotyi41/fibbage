import express from 'express';
import * as http from 'http';
import * as socketio from 'socket.io';
import cors from 'cors';

import Room from './Room.js';
import Player from './Player.js';
import Categories from './Categories.js';
import Fact from './Fact.js';

const categoriesInstance = new Categories();
var players = {};
var gameRooms = [];
var connections = [];

// Initialize express and socket io
const app = express();
const server = http.createServer(app);
server.listen(3001, () => console.log('Listening at ', 3001));

const io = new socketio.Server();
io.attach(server);

io.sockets.on('connection', function (socket) {
    // This callback runs when a new Socket.IO connection is established.
    connections.push(socket);

    // Player input her/his name and press send button (from player)
    socket.on(
        'send_player_name_to_server',
        function ({ playerName }, callback) {
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
            const oldPlayerId = Player.isPlayerAlreadyExists(
                playerName,
                players
            );

            // Player not exists yet, create it
            if (oldPlayerId === false) {
                const player = new Player(socket.id, socket.playerName);
                players[player.id] = player;
                console.log(
                    playerName + ' joined the server with id ' + socket.id
                );
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

            console.log(
                playerName + ' rejoined the server with id ' + socket.id
            );

            // If player is already joined to room
            if (player.room.id) {
                const room = gameRooms.find(
                    (room) => room.roomCode === player.room.roomCode
                );
                callback({ success: true, player: player, room: room });
                return;
            }

            // New player
            callback({ success: true, player: player });
        }
    );

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

    // Create room and join code (from room)
    socket.on('create_game_room_to_server', function (data, callback) {
        // Make 5 characters room code
        const roomCode = Room.makeRoomCode(5);
        const roomId = gameRooms.length;
        const room = new Room(roomId, roomCode);

        // Join to room
        socket.room = room;
        gameRooms.push(room);
        socket.join(socket.room.id);

        console.log('Room created successfully', room.roomCode);
        callback({ success: true, room: room });
    });

    // Join player to room (from player)
    socket.on(
        'player_join_to_room_to_server',
        function ({ roomCode }, callback) {
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

            // Now join to room
            socket.room = room;
            socket.join(socket.room.id);

            room.addPlayer(player);
            player.setRoom(socket.room);

            console.log(
                socket.playerName + ' joined game room ' + socket.room.roomCode
            );

            callback({ success: true, room: room, player: player });

            io.sockets
                .in(socket.room.id)
                .emit('player_joined_to_room_to_client', {
                    success: true,
                    room: room,
                    player: player
                });
        }
    );

    // Player status (ready for game or not, from player)
    socket.on('player_is_ready_to_server', function ({ ready }, callback) {
        const player = players[socket.id];

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

        console.log('rooms', gameRooms);

        // If room not found
        if (!room) {
            callback({
                success: false,
                code: 401,
                message: 'A szobát nem találom'
            });
            return;
        }

        room.setPlayer(player);
        room.checkEverybodyIn();

        // Send to player who is pressed the ready button
        callback({ success: true, room: room, player: player });

        console.log(player.playerName, 'is ready at room', room.roomCode);

        // Send to others
        io.sockets.in(socket.room.id).emit('player_is_ready_to_client', {
            success: true,
            room: room,
            player
        });
    });

    // Everybody in, start game (from player)
    socket.on('start_game_to_server', function (data, callback) {
        const player = players[socket.id];

        // If player not found
        if (!player) {
            callback({
                success: false,
                code: 400,
                message: 'A játékost nem sikerült beazonosítani'
            });
            return;
        }

        const room = player.getRoom(gameRooms);

        console.log('Start game', room);

        // Check all players are ready
        if (!room.checkEverybodyIn()) {
            // Not ready players
            const playersNotReady = room.players.filter(
                (player) => !player.ready
            );

            console.log('Not all players are ready', playersNotReady);

            callback({
                success: false,
                code: 400,
                message: playersNotReady.length + ' játékos még nem áll készen',
                room: room,
                player: player
            });
        }

        // Game is started
        console.log('Game started successfully', room);
        room.startRoom();
        callback({ success: true, room: room, player: player });

        // Send game is started to others
        io.sockets.in(socket.room.id).emit('game_started_to_client', {
            success: true,
            room: room,
            player: player
        });
    });

    // Get categories (from room)
    socket.on('get_categories_to_server', async function (data, callback) {
        const room = socket.room;

        // Find room of socket
        if (!room) {
            console.log('Room not found in socket');
            callback({
                success: false,
                message: 'A szoba nem létezik'
            });
            return;
        }

        // Room is already waiting for choose category by player
        if (room.waitingForChooseCategory) {
            console.log('Room already has categories', room.categories);
            callback({
                success: true,
                categories: room.categories,
                room: room
            });
            return;
        }

        // Get for choosing
        console.log('Get categories for room', room.roomCode);
        const categories = await categoriesInstance.getCategoriesForChoosing();

        // Select category set room properties
        console.log('Categories queried for choosing', categories);
        room.openSelectCategory(categories);

        callback({ success: true, room: room });

        // Send categories to others
        io.sockets
            .in(socket.room.id)
            .emit('waiting_for_choose_category_to_client', {
                success: true,
                categories: categories,
                room: room
            });
    });

    // Select category (from player)
    socket.on('select_category_to_server', function ({ category }, callback) {
        const player = players[socket.id];

        // If player not found
        if (!player) {
            console.log(
                'Failed to choose category by player. The player not found'
            );
            callback({
                success: false,
                code: 400,
                message: 'A játékost nem sikerült beazonosítani'
            });
            return;
        }

        const room = player.getRoom(gameRooms);

        // Detect room is exists
        if (!room) {
            console.log(
                'Failed to choose category by player. Room not found in socket'
            );
            callback({
                success: false,
                message: 'A szoba nem létezik'
            });
            return;
        }

        // If room doesn't need to choose category
        if (!room.waitingForChooseCategory) {
            console.log('Room not needed to choose category');
            callback({
                success: false,
                message: 'A kategória már kiválasztásra került'
            });
            return;
        }

        // Select category
        console.log('Select category', category);
        room.selectCategory(category);

        callback({ success: true, room: room, category: category });

        // Send the selected categories to others
        io.sockets.in(socket.room.id).emit('on_choose_category_to_client', {
            success: true,
            category: category,
            room: room
        });
    });

    // Todo in client side time is up
    // Get fact after choose category, and countdown until all players answered (from room)
    socket.on('get_fact_to_server', async function ({ category }, callback) {
        const room = socket.room;

        // Find room of socket
        if (!room) {
            console.log('Room not found in socket');
            callback({
                success: false,
                message: 'A szoba nem létezik'
            });
            return;
        }

        // Find the fact in category
        console.log('Find fact for category', category);
        const fact = await Fact.findOne({ category: category }).exec();
        room.setFact(fact);
        console.log('Set fact', fact);

        callback({
            success: true,
            fact: fact,
            room: room,
            time: room.playersTimeToTypeAnswer
        });

        // Send to all clients
        io.sockets.in(socket.room.id).emit('send_fact_to_client', {
            success: true,
            room: room,
            fact: fact,
            time: room.playersTimeToTypeAnswer
        });

        // Set timeout to type answers by the players
        setTimeout(() => {
            // Time is up to type answers by players
            room.timeIsUpTypeAnswer();

            io.sockets
                .in(socket.room.id)
                .emit('timeout_to_type_answers_to_client', {
                    success: true,
                    room: room
                });
        }, room.playersTimeToTypeAnswer * 1000);
    });

    // Send player answer to server (from player)
    socket.on('send_player_answer_to_server', function ({ answer }, callback) {
        const player = players[socket.id];

        // If player not found
        if (!player) {
            console.log(
                'Failed to send player answer to server. The player not found'
            );
            callback({
                success: false,
                code: 400,
                message: 'A játékost nem sikerült beazonosítani'
            });
            return;
        }

        const room = player.getRoom(gameRooms);

        // Detect room is exists
        if (!room) {
            console.log(
                'Failed to send player answer to server. Room not found in socket'
            );
            callback({
                success: false,
                message: 'A szoba nem létezik'
            });
            return;
        }

        // Set player answer at room
        room.setPlayerAnswer(player, answer);
        console.log('Set room', room);

        // Send answers to clients
        const roomPlayers = room.getPlayers();
        console.log('Send players in room', roomPlayers);

        callback({
            success: true,
            players: roomPlayers,
            player: player,
            room: room
        });

        // Send answered players to room / others
        io.sockets.in(socket.room.id).emit('on_player_sent_answer_to_client', {
            success: true,
            players: roomPlayers,
            player: player,
            room: room
        });
    });

    // After all players type their answers, get answers thay can choose (from room)
    socket.on('get_choosable_answers_to_server', function (data, callback) {
        const room = socket.room;

        // Find room of socket
        if (!room) {
            console.log('Room not found in socket');
            callback({
                success: false,
                message: 'A szoba nem létezik'
            });
            return;
        }

        console.log('Get random answers');
        const answers = room.getAnswersToChoose();
        console.log('Random answers queried', answers);

        // Send back to room
        callback({
            success: true,
            answers: answers,
            room: room,
            time: room.playersTimeToChooseAnswer
        });

        // Send choosable answers to players also
        io.sockets.in(socket.room.id).emit('send_choosable_answers_to_client', {
            success: true,
            answers: answers,
            room: room,
            time: room.playersTimeToChooseAnswer
        });

        // Set timeout to choose answers by the players
        setTimeout(() => {
            // Time is up to choose answers by players
            room.timeIsUpChooseAnswer();

            const players = room.getPlayers();

            io.sockets
                .in(socket.room.id)
                .emit('send_timeout_to_choose_answers_to_client', {
                    success: true,
                    room: room,
                    players: players
                });
        }, room.playersTimeToChooseAnswer * 1000);
    });

    // On player choose answer (from player)
    socket.on(
        'send_player_choosed_answer_to_server',
        function ({ answer }, callback) {
            let player = players[socket.id];

            // If player not found
            if (!player) {
                console.log(
                    'Failed to choose player answer to server. The player not found'
                );
                callback({
                    success: false,
                    code: 400,
                    message: 'A játékost nem sikerült beazonosítani'
                });
                return;
            }

            const room = player.getRoom(gameRooms);

            // Detect room is exists
            if (!room) {
                console.log(
                    'Failed to choose player answer to server. Room not found in socket'
                );

                callback({
                    success: false,
                    message: 'A szoba nem létezik'
                });

                return;
            }

            // Set player answer at room
            player = room.choosePlayerAnswer(player, answer);
            players[socket.id] = player;
            console.log('Set answer at room', room);

            // Send answers to clients
            const roomPlayers = room.getPlayers();
            console.log('Send players in room', roomPlayers);

            callback({
                success: true,
                players: roomPlayers,
                player: player,
                room: room
            });

            // Send answered players to room / others
            io.sockets
                .in(socket.room.id)
                .emit('send_player_choosed_answer_to_client', {
                    success: true,
                    players: roomPlayers,
                    room: room
                });
        }
    );

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
            .in(socket.room.id)
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
                .in(socket.room.id)
                .emit('update_active_players_to_client', { room: room });
            io.sockets
                .in(socket.room.id)
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
