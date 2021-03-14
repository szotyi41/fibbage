class GameRoom {
    constructor(id, roomCode) {
        this.id = id;
        this.roomCode = roomCode;
        this.players = [];
        this.bannedPlayers = [];
        this.started = false;
        this.everybodyReady = false;
        this.maxPlayers = Number.POSITIVE_INFINITY;
    }

    isAvailable() {
        return this.available === 'available';
    }

    getActivePlayerCount() {
        return this.players.length;
    }

    addPlayer(player) {
        // Check if this player already is in the room
        if (this.playerIsJoined(player.id)) return false;

        // Push player to array
        this.players.push(player);

        return this;
    }

    playerIsJoined(playerId) {
        return this.players.some((player) => players[i].id == playerId);
    }

    setPlayer(player) {
        for (var i = 0; i < this.players.length; i++) {
            if (this.players[i].id == player.id) {
                this.players[i] = player;
                break;
            }
        }
    }

    removePlayer(player) {
        for (var i = 0; i < this.players.length; i++) {
            if (this.players[i].id == player.id) {
                this.players.splice(i, 1);
                break;
            }
        }

        return this;
    }

    banPlayer(player) {
        for (var i = 0; i < this.bannedPlayers.length; i++) {
            if (this.bannedPlayers[i].id == player.id) {
                return;
            }
        }

        this.bannedPlayers.push(player);
    }

    checkEverybodyIn() {
        this.everybodyReady = this.players.every((player) => player.ready);
        return this.everybodyReady;
    }

    static makeRoomCode(length) {
        var result = '';
        var characters =
            'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
            result += characters.charAt(
                Math.floor(Math.random() * charactersLength)
            );
        }
        return result;
    }
}

module.exports = GameRoom;
