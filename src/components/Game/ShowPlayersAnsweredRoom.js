import { useEffect } from 'react';

const ShowPlayersAnsweredRoom = (props) => {
    const { setRoom, players, setPlayers } = props;

    // Waiting for someone sent her/his answer (type)
    const waitingForPlayersAnswered = () => {
        window.socket.on(
            'on_player_sent_answer_to_client',
            ({ success, room, players }) => {
                // Failed to get fact
                if (!success) {
                    console.log('Failed to get the answer from player');
                    return;
                }

                setRoom(room);
                setPlayers(players);
            }
        );
    };

    useEffect(waitingForPlayersAnswered, []);

    return (
        <div>
            {players
                .filter((player) => player.answered === true)
                .map((player) => player.name)}
        </div>
    );
};

export default ShowPlayersAnsweredRoom;
