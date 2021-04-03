import { useState } from 'react';

const TypeYourAnswerPlayer = (props) => {
    const { setRoom, setPlayers, setPlayer } = props;
    const [answer, setAnswer] = useState('');
    const [sendingAnswer, setSendingAnswer] = useState(false);

    const sendAnswer = () => {
        setSendingAnswer(true);
        window.socket.emit(
            'send_player_answer_to_server',
            { answer: answer },
            ({ success, room, players, player }) => {
                setSendingAnswer(false);

                // Failed to send your answer
                if (!success) {
                    console.log('Failed to send your answer');
                    return;
                }

                setRoom(room);
                setPlayers(players);
                setPlayer(player);
            }
        );
    };

    return (
        <div className="your-answer">
            {/* Type your answer */}
            <input
                type="text"
                className={'input ' + (sendingAnswer ? 'loading' : '')}
                value={answer}
                onInput={(event) => setAnswer(event.target.value)}
                placeholder="Írd be a szerinted legjobb hazugságot"
            />

            {/* Send answer button */}
            <button
                className="button button-prm"
                disabled={!answer.length}
                onClick={() => sendAnswer()}
            >
                Hazudok
            </button>
        </div>
    );
};

export default TypeYourAnswerPlayer;
