import React, { useEffect } from 'react';

const ShowAnswersPlayer = (props) => {
    const { setRoom, answers, setAnswers } = props;

    // Waiting for someone sent her/his answer (type)
    const waitingForPlayersAnswered = () => {
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

    // On player choose answer
    const chooseAnswer = (answer) => {
        window.socket.emit(
            'send_player_choosed_answer_to_server',
            { answer: answer },
            ({ success, message, room }) => {
                // Failed to get fact
                if (!success) {
                    console.log('Failed to get answers to choose', message);
                    return;
                }

                setRoom(room);
            }
        );
    };

    useEffect(waitingForPlayersAnswered, []);

    return (
        <div className="recommended-answers">
            {answers.map((answer, answerIndex) => (
                <div
                    className="answer"
                    key={answerIndex}
                    onClick={() => chooseAnswer(answer)}
                >
                    {answer}
                </div>
            ))}
        </div>
    );
};

export default ShowAnswersPlayer;
