import Player from './../Player.js';

const SendPlayerNameToServer = ({ socket, globalPlayers }) => (
    { playerName, socket, globalPlayers },
    callback
) => {
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
    const oldPlayerId = Player.isPlayerAlreadyExists(playerName, globalPlayers);

    // Player not exists yet, create it
    if (oldPlayerId === false) {
        const player = new Player(socket.id, socket.playerName);
        globalPlayers[player.id] = player;
        console.log(playerName + ' joined the server with id ' + socket.id);
        callback({ success: true, player: player });

        // Send update to all players
        io.sockets.emit('update_players', globalPlayers);

        // send game room list to the newly registered client
        socket.emit('update_game_rooms', { rooms: gameRooms });

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
};

export default SendPlayerNameToServer;
