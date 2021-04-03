import React, { useState } from 'react';

const AskRoomCodePlayer = (props) => {
    const { setPlayer, setRoom } = props;
    const [roomCode, setRoomCode] = useState('code');
    const [errorMessage, setErrorMessage] = useState('');
    const [joiningGameRoom, setJoiningGameRoom] = useState(false);

    /* Join player to room with room code */
    const joinToRoom = (roomCode) => {
        console.log('Try to join room: ', roomCode);
        setJoiningGameRoom(true);
        window.socket.emit(
            'player_join_to_room_to_server',
            {
                roomCode: roomCode
            },
            ({ success, message, room, player }) => {
                setJoiningGameRoom(false);

                // Failed to join room
                if (!success) {
                    setErrorMessage(message);
                    console.log('Failed to join room', message);
                    return;
                }

                // Player successfully joined
                console.log(player, 'is successfully joined to room', room);
                setErrorMessage('');
                setRoom(room);
                setPlayer(player);
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

export default AskRoomCodePlayer;
