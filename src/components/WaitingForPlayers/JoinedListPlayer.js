import { useEffect } from 'react';

const JoinedListPlayer = ({ setRoom, players, setPlayers }) => {
    // Subscribe to update room events
    const waitingForPlayers = () => {
        console.log('Create room at server');

        // Waiting for joining players
        window.socket.on(
            'player_joined_to_room_to_client',
            ({ success, message, room, player }) => {
                // Failed to join player
                if (!success) {
                    console.log(
                        'Failed to update room when player joining',
                        message
                    );
                    return;
                }

                // Player is joined, update the room
                console.log('Player', player, 'joined to room', room);
                setRoom(room);
                setPlayers(room.players);
            }
        );

        // Waiting for players press to ready button
        window.socket.on(
            'player_is_ready_to_client',
            ({ success, message, room, player }) => {
                // Failed to set ready player
                if (!success) {
                    console.log(
                        'Failed to update room when player is ready',
                        message
                    );
                    return;
                }

                // Player is ready
                console.log('Player', player, 'is ready in', room);
                setRoom(room);
                setPlayers(room.players);
            }
        );
    };

    useEffect(waitingForPlayers, [setPlayers, setRoom]);

    return (
        <div className="players-joined-section">
            <div className="players-joined">
                {players.map((player, playerIndex) => (
                    <div className="player-answer" key={playerIndex}>
                        <img
                            className="player-profile"
                            src="../assets/player.png"
                            alt=""
                        />

                        {/* Show player ready */}
                        <i
                            className={
                                'fa ' + (player.ready ? 'fa-check' : 'fa-times')
                            }
                        ></i>

                        <div className="player-name">{player.playerName}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default JoinedListPlayer;
