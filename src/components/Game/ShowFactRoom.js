import { useEffect, useState } from 'react';
import ShowAnswersRoom from './ShowAnswersRoom';
import ShowPlayersAnsweredRoom from './ShowPlayersAnsweredRoom';

const ShowFactRoom = (props) => {
    const { room, setRoom, fact, setFact, players, setPlayers } = props;

    const [countdown, setCountdown] = useState(20);
    const [intervalState, setIntervalState] = useState({});

    // Get the fact at arrive to this component (once per round)
    const getFact = () => {
        const category = room.category;
        console.log('Start query fact', fact);
        window.socket.emit(
            'get_fact_to_server',
            { category: category },
            ({ success, message, room, fact, time }) => {
                // Failed to get fact
                if (!success) {
                    console.log('Failed to get fact', message);
                    return;
                }

                // Fact queried successfully
                console.log('Fact queried successfully', fact);
                setRoom(room);
                setFact(fact);
                startCountdown(time);
            }
        );
    };

    // Start countdown when
    const startCountdown = (secs) => {
        // Set at start from property
        setCountdown(secs);

        // Start interval
        const interval = setInterval(() => {
            console.log('countdown', countdown);
            setCountdown(countdown - 1);

            // Countdown finished
            if (countdown <= 1) {
                clearInterval(interval);
            }
        }, 1000);
    };

    // Get the fact when you arrive to this component
    useEffect(getFact, []);

    return (
        <div>
            <h1>{fact.fact}</h1>

            <h2>{countdown}</h2>

            {fact.fact ? (
                <div>
                    {/* Waiting for players send answers */}
                    {room.waitingForTypeAnswers ? (
                        <ShowPlayersAnsweredRoom
                            {...props}
                        ></ShowPlayersAnsweredRoom>
                    ) : (
                        <ShowAnswersRoom {...props}></ShowAnswersRoom>
                    )}
                </div>
            ) : (
                <div>
                    {/* Waiting for the fact details */}
                    <h1>...</h1>
                </div>
            )}
        </div>
    );
};
export default ShowFactRoom;
