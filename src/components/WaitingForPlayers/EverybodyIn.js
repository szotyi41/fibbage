import { useEffect, useState } from 'react';

const EverybodyIn = (props) => {
    const { player, setPlayer, room, setRoom, players, setPlayers } = props;
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
            'player_ready_to_server',
            {
                ready: ready
            },
            (data) => {
                setSendingPlayerIsReady(false);
                if (!data.success) {
                    setErrorMessage(data.message);
                    console.log('Failed to set ready status: ', data.message);
                    return;
                }
                console.log('Player is ready for the game', data.player);
                setErrorMessage('');
                setRoom(data.room);
                setPlayer(data.player);
            }
        );
    };

    /* Send everybody in to server */
    const sendEverybodyIn = () => {
        console.log('Start send everybody in');
        setSendingEverybodyIn(true);
        window.socket.emit('everybody_in_to_server', (data) => {
            setSendingEverybodyIn(false);
            if (!data.success) {
                setErrorMessage(data.message);
                console.log('Failed to set everybody in: ', data.message);
                return;
            }
            console.log('Start game, everybody in');
            setErrorMessage('');
            setRoom(data.room);
            setPlayer(data.player);
        });
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

export default EverybodyIn;
