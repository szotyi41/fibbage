import React, { useState, useEffect } from 'react';

const AskPlayerName = ({ room, setRoom, player, setPlayer }) => {
    const [playerName, setPlayerName] = useState('');
    const [joiningPlayer, setJoiningPlayer] = useState(false);

    const sendPlayerName = (playerName) => {
        console.log('Send player name to server: ', playerName);
        setJoiningPlayer(true);
        window.socket.emit(
            'send_player_name_to_server',
            {
                playerName: playerName
            },
            (data) => {
                setJoiningPlayer(false);
                if (!data.success) {
                    console.log('Failed to connect player: ', data.message);
                    return;
                }
                console.log(
                    'Player is logged in',
                    data.player,
                    ' to room ',
                    data.room
                );
                setPlayer(data.player);

                // If you already joined to room, rejoin
                if (typeof data.room !== 'undefined') {
                    setRoom(data.room);
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

export default AskPlayerName;
