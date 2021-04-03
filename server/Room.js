class Room {
    // Init variables
    constructor(id, roomCode) {
        this.id = id;
        this.roomCode = roomCode;
        this.players = [];
        this.bannedPlayers = [];
        this.maxPlayers = Number.POSITIVE_INFINITY;
        this.round = 0;

        // Rules
        this.playersTimeToAnswer = 1000 * 20;
        this.choosableAnswersNumber = 6;

        // Joining progress
        this.started = false;
        this.everybodyReady = false;

        // Game progress
        this.nextRound();
    }

    // Clear round details
    nextRound() {
        // Category selecting part
        this.categories = [];
        this.playerWhoHaveToChooseCategory = {};
        this.waitingForChooseCategory = false;
        this.category = '';

        // Lie typing part
        this.fact = {};
        this.waitingForTypeAnswers = false;

        // If this is not the first round, remove answers
        this.players = this.players.map((player) => ({
            ...player,
            answer: '',
            answered: false
        }));

        // Set answers to choose by players
        this.answers = [];
    }

    // Start room
    startRoom() {
        this.started = true;
    }

    // Add player to room
    addPlayer(player) {
        // Check if this player already is in the room
        if (this.playerIsJoined(player.id)) return false;

        // Push player to array
        this.players.push(player);

        return this;
    }

    // Check player is joined
    playerIsJoined(playerId) {
        return this.players.some((player) => player.id == playerId);
    }

    // Set player in room
    setPlayer(player) {
        for (var i = 0; i < this.players.length; i++) {
            if (this.players[i].id == player.id) {
                this.players[i] = player;
                break;
            }
        }
    }

    // Remove player from room
    removePlayer(removePlayer) {
        this.players = this.players.filter(
            (player) => player.id === removePlayer.id
        );
        return this;
    }

    // Check everybody in room before start game
    checkEverybodyIn() {
        this.everybodyReady = this.players.every((player) => player.ready);
        return this.everybodyReady;
    }

    // Show game categories
    openSelectCategory(categories) {
        this.waitingForChooseCategory = true;
        this.categories = categories;
        this.playerWhoHaveToChooseCategory = this.players[this.round];
    }

    // The player selected category
    selectCategory(category) {
        this.waitingForChooseCategory = false;
        this.category = category;
    }

    // Set fact in room after choose category
    setFact(fact) {
        this.waitingForTypeAnswers = true;
        this.fact = fact;
    }

    // Set typed answer (not selected) of player
    setPlayerAnswer(player, answer) {
        const playerIndex = this.players
            .map((player) => player.id)
            .indexOf(player.id);

        player = {
            ...this.players[playerIndex],
            answer: answer,
            answered: true
        };

        // Set player answer
        this.players[playerIndex] = player;

        // If everybody answered in time, set room status
        if (this.checkEverybodyAnswered()) {
            this.waitingForTypeAnswers = false;
        }

        // Return the current player
        return player;
    }

    // If everybody answered
    checkEverybodyAnswered() {
        return this.players.every((player) => player.answered);
    }

    // After set the answer, get players to know who answer what
    getPlayers() {
        return this.players;
    }

    // Get the answers player can choose after type their lies
    getAnswersToChoose() {
        const playerAnswers = this.players.map((player) => player.answer);
        const correctAnswer = this.fact.correct;
        const recommendedAnswers = this.fact.recommended;

        console.log('Use fact answers', recommendedAnswers);

        // Answers must include
        let answersToChoose = [correctAnswer, ...playerAnswers];

        do {
            // Random answer index from recommended
            const answerIndex = Math.floor(
                Math.random() * recommendedAnswers.length
            );

            // Get recommended answer
            const recommendedAnswer = recommendedAnswers[answerIndex];

            // If the recommended answer not already in answers to choose
            if (!answersToChoose.includes(recommendedAnswer)) {
                answersToChoose.push(recommendedAnswer);
            }
        } while (answersToChoose.length < this.choosableAnswersNumber);

        this.answers = answersToChoose;

        return answersToChoose;
    }

    banPlayer(player) {
        for (let i = 0; i < this.bannedPlayers.length; i++) {
            if (this.bannedPlayers[i].id == player.id) {
                return;
            }
        }

        this.bannedPlayers.push(player);
    }

    // Make room code
    static makeRoomCode(length) {
        return 'code';
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

export default Room;
