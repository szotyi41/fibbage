import React, { useState } from 'react';

const AskNamePlayer = ({ setRoom, setPlayer }) => {
    const [playerName, setPlayerName] = useState('Péter');
    const [joiningPlayer, setJoiningPlayer] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    /* Send player name to server */
    const sendPlayerName = (playerName) => {
        console.log('Send player name to server: ', playerName);
        setJoiningPlayer(true);
        window.socket.emit(
            'send_player_name_to_server',
            {
                playerName: playerName
            },
            ({ success, message, room, player }) => {
                setJoiningPlayer(false);

                // Failed to set player name
                if (!success) {
                    setErrorMessage(message);
                    console.log('Failed to connect player', message);
                    return;
                }

                // Player successfully joined to room
                console.log('Player is connected', player);
                setPlayer(player);
                setErrorMessage('');

                // If you already joined to room, rejoin
                if (typeof room !== 'undefined') {
                    setRoom(room);
                }
            }
        );
    };

    return (
        <div className="enter-player-name">
            <h1>Írd be a neved, hogy tudják társaid kit verhetnek át:</h1>
            <input
                type="text"
                className="input"
                value={playerName}
                onInput={(event) => setPlayerName(event.target.value)}
                placeholder="Írd be a neved"
            />

            <div className="error-message">{errorMessage}</div>

            {/* Loading spinner or send player name button */}
            {joiningPlayer ? (
                <button className="button button-prm" disabled={true}>
                    <i className="fa fa-spinner fa-spin"></i>
                </button>
            ) : (
                <button
                    className="button button-prm"
                    onClick={() => sendPlayerName(playerName)}
                    disabled={!playerName.length}
                >
                    Mehet
                </button>
            )}
        </div>
    );
};

export default AskNamePlayer;
