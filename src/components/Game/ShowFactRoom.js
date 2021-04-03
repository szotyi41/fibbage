import { useEffect } from 'react';
import ShowAnswersRoom from './ShowAnswersRoom';
import ShowPlayersAnsweredRoom from './ShowPlayersAnsweredRoom';

const ShowFactRoom = (props) => {
    const { room, setRoom, fact, setFact, players, setPlayers } = props;

    // Get the fact at arrive to this component (once per round)
    const getFact = () => {
        const category = room.category;
        console.log('Start query fact', fact);
        window.socket.emit(
            'get_fact_to_server',
            { category: category },
            ({ success, message, room, fact }) => {
                // Failed to get fact
                if (!success) {
                    console.log('Failed to get fact', message);
                    return;
                }

                // Fact queried successfully
                console.log('Fact queried successfully', fact);
                setRoom(room);
                setFact(fact);
            }
        );
    };

    // Get the fact when you arrive to this component
    useEffect(getFact, []);

    return (
        <div>
            <h1>{fact.fact}</h1>

            {fact.fact ? (
                <div a={console.log('sds')}>
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
