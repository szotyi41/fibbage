import React, { useState, useEffect } from 'react';

const AskGameRoom = (props) => {
    const { player, setPlayer, room, setRoom } = props;
    const [roomCode, setRoomCode] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [joiningGameRoom, setJoiningGameRoom] = useState(false);

    const joinToRoom = (roomCode) => {
        console.log('Try to join room: ', roomCode);
        setJoiningGameRoom(true);
        window.socket.emit(
            'join_game_room_to_server',
            {
                roomCode: roomCode
            },
            (data) => {
                setJoiningGameRoom(false);
                if (!data.success) {
                    setErrorMessage(data.message);
                    console.log('Failed to connect room: ', data.message);
                    return;
                }
                console.log('Player is successfully joined to room', data.room);
                setErrorMessage('');
                setRoom(data.room);
                setPlayer(data.player);
            }
        );
    };

    return (
        <div className="ask-room-code-section">
            <h1>
                Írd be a szobakódot, hogy társaiddal egy játékba kerüljetek:
            </h1>
            <input
                type="text"
                className="input"
                value={roomCode}
                onInput={(event) => setRoomCode(event.target.value)}
                placeholder="Írd be a szobakódot"
            />

            {/* Error message */}
            <span className="error-message">{errorMessage}</span>

            {/* Loading spinner or send game room button */}
            {joiningGameRoom ? (
                <button className="button button-prm" disabled={true}>
                    <i className="fa fa-spinner fa-spin"></i>
                </button>
            ) : (
                <button
                    className="button button-prm"
                    onClick={() => joinToRoom(roomCode)}
                    disabled={!roomCode.length}
                >
                    Mehet
                </button>
            )}
        </div>
    );
};

export default AskGameRoom;
