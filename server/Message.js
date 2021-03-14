function Message(player, text, gameRoomId, sentAt) {
    this.player = player; // from player
    this.text = text;
    this.gameRoomId = gameRoomId;
    this.sentAt = sentAt;
    this.isPrivate = false;
    this.toPlayer = ''; // to player
}

Message.prototype.getSentAt = function () {
    return this.sentAt;
};

Message.prototype.getText = function () {
    return this.text;
};

module.exports = Message;
