import { useEffect, useState } from 'react';

const EverybodyInButtonPlayer = (props) => {
    const { player, setPlayer, room, setRoom, players } = props;
    const [notReadyPlayers, setNotReadyPlayers] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');
    const [sendingPlayerIsReady, setSendingPlayerIsReady] = useState(false);
    const [sendingEverybodyIn, setSendingEverybodyIn] = useState(false);

    /* On players change, compute not ready players */
    useEffect(() => {
        setNotReadyPlayers(players.filter((player) => !player.ready));
    }, [players]);

    /* Send player is ready status */
    const sendPlayerIsReady = (ready) => {
        console.log('Start send player is ready: ', ready);
        setSendingPlayerIsReady(true);
        window.socket.emit(
            'player_is_ready_to_server',
            {
                ready: ready
            },
            ({ success, message, room, player }) => {
                setSendingPlayerIsReady(false);

                // Failed to set player status to ready
                if (!success) {
                    setErrorMessage(message);
                    console.log('Failed to set ready status: ', message);
                    return;
                }

                // Player is ready for the game
                console.log('Player is ready for the game', player);
                setErrorMessage('');
                setRoom(room);
                setPlayer(player);
            }
        );
    };

    /* Send everybody in to server when all players are ready */
    const sendEverybodyIn = () => {
        console.log('Start send everybody in for room', room);

        setSendingEverybodyIn(true);
        window.socket.emit(
            'start_game_to_server',
            {},
            ({ success, message, room, player }) => {
                setSendingEverybodyIn(false);

                // Failed to send start game
                if (!success) {
                    setErrorMessage(message);
                    console.log('Failed to set everybody in: ', message);
                    return;
                }

                // Start game successfully
                console.log('You started the game', room);
                setErrorMessage('');
                setRoom(room);
                setPlayer(player);
            }
        );
    };

    return (
        <div>
            {/* Player is ready button */}
            <div className="player-is-ready-section">
                {player.ready ? (
                    /* Wait more */
                    <button
                        className="button button-sec start-game"
                        onClick={() => sendPlayerIsReady(false)}
                        disabled={sendingPlayerIsReady}
                    >
                        <i className="fa fa-times"></i>
                        <span>Várjunk még egy kicsit</span>
                    </button>
                ) : (
                    /* Ready */
                    <button
                        className="button button-prm start-game"
                        onClick={() => sendPlayerIsReady(true)}
                        disabled={sendingPlayerIsReady}
                    >
                        <i className="fa fa-check"></i>
                        <span>Felőlem indulhat</span>
                    </button>
                )}
            </div>

            {/* Everybody's in button */}
            {room.everybodyReady ? (
                <div className="everybody-in-section">
                    <button
                        className="button button-prm"
                        onClick={() => sendEverybodyIn()}
                        disabled={sendingEverybodyIn}
                    >
                        <span>Mindenki kész</span>
                    </button>
                </div>
            ) : (
                <div className="everybody-in-section">
                    <span>
                        {notReadyPlayers.length + ' '}
                        játékos még nem áll készen
                    </span>
                </div>
            )}

            {/* Error message */}
            <div className="error-message">{errorMessage}</div>
        </div>
    );
};

export default EverybodyInButtonPlayer;
