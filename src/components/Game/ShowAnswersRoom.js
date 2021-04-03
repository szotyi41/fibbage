import React, { useState, useEffect } from 'react';

const ShowAnswersRoom = (props) => {
    const { setRoom, answers, setAnswers } = props;

    // Waiting for someone sent her/his answer (type)
    const getChoosableAnswers = () => {
        window.socket.emit(
            'get_choosable_answers_to_server',
            {},
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

    useEffect(getChoosableAnswers, []);

    return (
        <div className="recommended-answers">
            {answers.map((answer, answerIndex) => (
                <div className="answer" key={answerIndex}>
                    {answer}
                </div>
            ))}
        </div>
    );
};

export default ShowAnswersRoom;
