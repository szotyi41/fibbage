import express from 'express';
import * as http from 'http';
import * as socketio from 'socket.io';
import cors from 'cors';

import Room from './Room.js';
import Player from './Player.js';
import Categories from './Categories.js';
import Fact from './Fact.js';

import SendPlayerNameToServer from './actions/SendPlayerNameToServer.js';
import SendPlayerChoosedAnswerToServer from './actions/SendPlayerChoosedAnswerToServer.js';

const categoriesInstance = new Categories();
var globalPlayers = {};
var globalGameRooms = [];
var globalConnections = [];

// Initialize express and socket io
const app = express();
const server = http.createServer(app);
server.listen(3001, () => console.log('Listening at ', 3001));

const io = new socketio.Server();
io.attach(server);

io.sockets.on('connection', function (socket) {
    // This callback runs when a new Socket.IO connection is established.
    globalConnections.push(socket);

    // Player input her/his name and press send button (from player)
    socket.on('send_player_name_to_server', ({ playerName }, callback) => {
        // Playername is empty
        if (!playerName) {
            callback({
                success: false,
                message: 'Player name cannot be empty'
            });
            return;
        }

        console.log('pname', playerName);

        socket.playerName = playerName;

        // Check player is already exists
        const oldPlayerId = Player.isPlayerAlreadyExists(
            playerName,
            globalPlayers
        );

        // Player not exists yet, create it
        if (oldPlayerId === false) {
            const player = new Player(socket.id, socket.playerName);
            globalPlayers[player.id] = player;
            console.log(playerName + ' joined the server with id ' + socket.id);
            callback({ success: true, player: player });

            // Send update to all players
            io.sockets.emit('update_players', globalPlayers);

            // send game room list to the newly registered client
            socket.emit('update_game_rooms', { rooms: globalGameRooms });

            return;
        }

        // if playerName already exists, then reset the id to the socket id
        const oldPlayer = players[oldPlayerId];
        const player = oldPlayer;
        player.id = socket.id;
        globalPlayers[player.id] = player;

        // Delete the old player
        delete globalPlayers.oldPlayerId;

        // Update players (like observer)
        for (var i = 0; i < globalGameRooms.length; i++) {
            var room = globalGameRooms[i];

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

        // If player is already joined to room
        if (player.room.id) {
            const room = globalGameRooms.find(
                (room) => room.roomCode === player.room.roomCode
            );
            callback({ success: true, player: player, room: room });
            return;
        }

        // New player
        callback({ success: true, player: player });
    });

    // Remove socket from connection, if there is a playerName
    socket.on('disconnect', function (data) {
        /* const player = globalPlayers[socket.id];

        // Remove this player from all other game rooms' player lists
        if (typeof player !== 'undefined') {
            player.removeFromAllRooms(globalGameRooms);
        }

        // Remove socket connection
        globalConnections.splice(globalConnections.indexOf(socket), 1);
        console.log(
            socket.id,
            'is disconnected: ',
            globalConnections.length,
            ' globalConnections remaining'
        );

        // send update to all globalPlayers
        io.sockets.emit('update_globalPlayers', globalPlayers);
        io.sockets.emit('update_game_rooms', { rooms: globalGameRooms }); */
    });

    // Create room and join code (from room)
    socket.on('create_game_room_to_server', function (data, callback) {
        // Make 5 characters room code
        const roomCode = Room.makeRoomCode(5);
        const roomId = globalGameRooms.length;
        const room = new Room(roomId, roomCode);

        // Join to room
        socket.room = room;
        globalGameRooms.push(room);
        socket.join(socket.room.id);

        console.log('Room created successfully', room.roomCode);
        callback({ success: true, room: room });
    });

    // Join player to room (from player)
    socket.on(
        'player_join_to_room_to_server',
        function ({ roomCode }, callback) {
            const room = globalGameRooms.find(
                (room) => room.roomCode === roomCode
            );
            const player = globalPlayers[socket.id];

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
            player.removeFromAllRooms(globalGameRooms);

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
        const player = globalPlayers[socket.id];

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
        const room = player.getRoom(globalGameRooms);

        console.log('rooms', globalGameRooms);

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
        const player = globalPlayers[socket.id];

        // If player not found
        if (!player) {
            callback({
                success: false,
                code: 400,
                message: 'A játékost nem sikerült beazonosítani'
            });
            return;
        }

        const room = player.getRoom(globalGameRooms);

        console.log('Start game', room);

        // Check all globalPlayers are ready
        if (!room.checkEverybodyIn()) {
            // Not ready globalPlayers
            const globalPlayersNotReady = room.globalPlayers.filter(
                (player) => !player.ready
            );

            console.log(
                'Not all globalPlayers are ready',
                globalPlayersNotReady
            );

            callback({
                success: false,
                code: 400,
                message:
                    globalPlayersNotReady.length +
                    ' játékos még nem áll készen',
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
        const player = globalPlayers[socket.id];

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

        const room = player.getRoom(globalGameRooms);

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
    // Get fact after choose category, and countdown until all globalPlayers answered (from room)
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
            time: room.globalPlayersTimeToTypeAnswer
        });

        // Send to all clients
        io.sockets.in(socket.room.id).emit('send_fact_to_client', {
            success: true,
            room: room,
            fact: fact,
            time: room.globalPlayersTimeToTypeAnswer
        });

        // Function what happening when time is out type answers
        const onTimeoutTypeAnswer = () => {
            console.log('Time is out to type answers');

            // Time is up to type answers by globalPlayers
            room.timeIsUpTypeAnswer();

            io.sockets
                .in(socket.room.id)
                .emit('timeout_to_type_answers_to_client', {
                    success: true,
                    room: room
                });
        };

        // Set timeout to type answers by the globalPlayers
        room.timeoutTypeAnswer = setTimeout(
            onTimeoutTypeAnswer,
            room.globalPlayersTimeToTypeAnswer * 1000
        );
    });

    // Send player answer to server (from player)
    socket.on('send_player_answer_to_server', ({ answer }, callback) => {
        let player = globalPlayers[socket.id];

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

        const room = player.getRoom(globalGameRooms);

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

        // Send answered globalPlayers to room / others
        io.sockets.in(socket.room.id).emit('on_player_sent_answer_to_client', {
            success: true,
            players: roomPlayers,
            player: player,
            room: room
        });
    });

    // After all globalPlayers type their answers, get answers thay can choose (from room)
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

        // Send choosable answers to globalPlayers also
        io.sockets.in(socket.room.id).emit('send_choosable_answers_to_client', {
            success: true,
            answers: answers,
            room: room,
            time: room.playersTimeToChooseAnswer
        });

        // Define function what happened on timeout choose answer
        const onTimeoutChooseAnswer = () => {
            console.log(
                'Time is up to choose answers, elapsed time more than',
                room.playersTimeToChooseAnswer,
                'secs'
            );

            // Time is up to choose answers by globalPlayers
            room.timeIsUpChooseAnswer();

            // After timeout get globalPlayers (to know who did not choosed)
            const roomPlayers = room.getPlayers();

            io.sockets
                .in(socket.room.id)
                .emit('send_timeout_to_choose_answers_to_client', {
                    success: true,
                    room: room,
                    players: roomPlayers
                });
        };

        // Set timeout to choose answers by the globalPlayers
        room.timeoutChooseAnswer = setTimeout(
            onTimeoutChooseAnswer,
            room.playersTimeToChooseAnswer * 1000
        );
    });

    // On player choose answer (from player)
    socket.on(
        'send_player_choosed_answer_to_server',
        ({ answer }, callback) => {
            let player = globalPlayers[socket.id];

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

            const room = player.getRoom(globalGameRooms);

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
            globalPlayers[socket.id] = player;
            console.log('Set answer at room', room);

            // If everybody chooseed in time, clear timeout choose answer
            if (room.checkEverybodyChoosed()) {
                console.log('Everybody choosed in time');
                room.waitingForPlayerChoosing = false;
                room.showResults = true;
                clearTimeout(room.timeoutChooseAnswer);
            }

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
                    player: player,
                    room: room
                });
        }
    );
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
