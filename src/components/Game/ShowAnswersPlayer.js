import React, { useEffect } from 'react';

const ShowAnswersPlayer = (props) => {
    const {
        player,
        setPlayer,
        setRoom,
        answers,
        setAnswers,
        players,
        setPlayers
    } = props;

    // Waiting for the answers which can choose (on init)
    const waitingForChoosableAnswers = () => {
        window.socket.on(
            'send_choosable_answers_to_client',
            ({ success, message, room, answers }) => {
                // Failed to get fact
                if (!success) {
                    console.log('Failed to get answers to choose', message);
                    return;
                }

                setRoom(room);
                setAnswers(answers);
            }
        );
    };

    // Waiting for choosed answer by the other players (on init)
    const waitingForChoosedAnswerByAnotherPlayer = () => {
        window.socket.on(
            'send_player_choosed_answer_to_client',
            ({ success, message, room, players }) => {
                if (!success) {
                    console.log(
                        'Failed to get someone choosed answer',
                        message
                    );
                }

                setRoom(room);
                setPlayers(players);
            }
        );
    };

    // Waiting for timeout (if one or more player cannot choose in time)
    const waitingForTimeoutIfSomePlayerNotChoosed = () => {
        window.socket.on(
            'send_timeout_to_choose_answers_to_client',
            ({ room, players }) => {
                console.log(
                    'Time is out, players not choosed: ',
                    players.filter((player) => !player.choosed)
                );
                setRoom(room);
                setPlayers(players);
            }
        );
    };

    // On player choose answer
    const chooseAnswer = (answer) => {
        if (player.answer === answer) {
            alert('Ne válaszd a saját válaszod');
            return;
        }

        console.log('Send choosed answer', answer);

        window.socket.emit(
            'send_player_choosed_answer_to_server',
            { answer: answer },
            ({ success, message, room, player }) => {
                // Failed to get fact
                if (!success) {
                    console.log('Failed to get answers to choose', message);
                    return;
                }

                console.log('Answer choosed by you', player, room, players);
                setRoom(room);
                setPlayer(player);
                setPlayers(players);
            }
        );
    };

    useEffect(waitingForChoosableAnswers, []);
    useEffect(waitingForChoosedAnswerByAnotherPlayer, []);
    useEffect(waitingForTimeoutIfSomePlayerNotChoosed, []);

    return (
        <div className="recommended-answers">
            {answers.map((answer, answerIndex) => (
                <button
                    className={
                        'answer answer-player' +
                        (player.answer === answer ? ' your-answer' : '')
                    }
                    key={answerIndex}
                    disabled={player.answer === answer}
                    onClick={() => chooseAnswer(answer)}
                >
                    {answer}
                </button>
            ))}
        </div>
    );
};

export default ShowAnswersPlayer;
