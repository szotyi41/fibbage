export default function SendPlayerChoosedAnswerToServerfunction(
    { answer },
    callback
) {
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
    io.sockets.in(socket.room.id).emit('send_player_choosed_answer_to_client', {
        success: true,
        players: roomPlayers,
        room: room
    });
}
