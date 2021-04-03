import { useEffect } from 'react';
import TypeYourAnswerPlayer from './TypeYourAnswerPlayer';
import ShowAnswersPlayer from './ShowAnswersPlayer';

const ShowFactPlayer = (props) => {
    const { player, room, setRoom, fact, setFact } = props;

    // Get the fact
    const waitingForFact = () => {
        window.socket.on('send_fact_to_client', ({ room, fact }) => {
            // Fact queried successfully
            console.log('Fact queried successfully', room);
            setRoom(room);
            setFact(fact);
        });
    };

    // Get the fact when you arrive to this component
    useEffect(waitingForFact, [setRoom, setFact]);

    return (
        <div>
            <h1>{fact.fact}</h1>

            {room.waitingForTypeAnswers ? (
                /* Type your answer */
                !player.answered ? (
                    <TypeYourAnswerPlayer {...props}></TypeYourAnswerPlayer>
                ) : (
                    <h1>Várj a többi játékos válaszára</h1>
                )
            ) : (
                <ShowAnswersPlayer {...props}></ShowAnswersPlayer>
            )}
        </div>
    );
};
export default ShowFactPlayer;
