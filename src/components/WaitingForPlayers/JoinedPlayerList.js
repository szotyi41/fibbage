import { useEffect } from 'react';

const JoinedPlayerList = ({ setRoom, players, setPlayers }) => {
    // Subscribe to update_room event
    const waitingForPlayers = () => {
        console.log('Create room at server');
        window.socket.on('update_room_to_client', (data) => {
            if (!data.success) {
                console.log('Failed to update room', data.message);
                return;
            }
            setRoom(data.room);
            setPlayers(data.room.players);
        });
    };

    useEffect(waitingForPlayers, []);

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
                        {player.ready ? (
                            <i className="fa fa-check"></i>
                        ) : (
                            <i className="fa fa-times"></i>
                        )}

                        <div className="player-name">{player.playerName}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default JoinedPlayerList;
