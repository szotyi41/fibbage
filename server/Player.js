class Player {
    constructor(id, playerName) {
        this.id = id;
        this.playerName = playerName;
        this.room = false;
        this.ready = false;
    }

    getId() {
        return this.id;
    }

    getPlayername() {
        return this.playerName;
    }

    getRoom(rooms) {
        return rooms.find((room) => room.roomCode === this.room);
    }

    setReady(ready) {
        this.ready = ready;
        return this;
    }

    isBannedFromRoom(room) {
        return typeof room.bannedPlayers.findId(this.id) !== 'undefined';
    }

    isPlayerInRoom(room) {
        return typeof room.players.findId(this.id) !== 'undefined';
    }

    removeFromAllRooms(rooms) {
        for (var i = 0; i < rooms.length; i++) {
            var room = rooms[i];
            if (this.isPlayerInRoom(room)) {
                room.removePlayer(this);
            }
        }
    }

    static isPlayerAlreadyExists(playerName, listOfAllPlayers) {
        var oldPlayerId;
        for (var id in listOfAllPlayers) {
            if (listOfAllPlayers.hasOwnProperty(id)) {
                if (listOfAllPlayers[id].playerName === playerName) {
                    oldPlayerId = id;
                    return oldPlayerId;
                }
            }
        }

        return false;
    }
}

module.exports = Player;
