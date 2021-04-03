import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';

import AskGameRoom from './AskGameRoom';
import AskPlayerName from './AskPlayerName';
import JoinedListPlayer from './JoinedListPlayer';
import JoinedListRoom from './JoinedListRoom';
import JoinedPlayer from './JoinedPlayer';
import ShowGameRoom from './ShowGameRoom';
import EverybodyInButtonPlayer from './EverybodyInButtonPlayer';
import { useEffect } from 'react';

const WaitingForPlayers = (props) => {
    const { player, room, setRoom } = props;

    useEffect(() => console.log('Room is: ', room), [room]);

    const waitingForStartGame = () => {
        console.log('Waiting for start the game');

        // Waiting for start the game by player
        window.socket.on(
            'game_started_to_client',
            ({ success, message, room, player }) => {
                // Failed to start the game
                if (!success) {
                    console.log('Start the game', message);
                    return;
                }

                // Player is started the game
                console.log('Player', player, 'is started the game', room);
                setRoom(room);
            }
        );
    };

    // Waiting for start the game
    useEffect(waitingForStartGame, [setRoom]);

    return (
        <div className="waiting-for-players-content">
            <Router>
                <Switch>
                    {/* Show room code */}
                    <Route path="/room">
                        <div className="room-screen">
                            <ShowGameRoom {...props}></ShowGameRoom>
                            <JoinedListRoom {...props}></JoinedListRoom>
                        </div>
                    </Route>

                    {/* Type player name, connect to room, show joined players, player is ready */}
                    <Route path="/player">
                        <div className="player-screen">
                            {!player.playerName ? (
                                /* Ask player name */
                                <div className="enter-player-name-section">
                                    <AskPlayerName {...props}></AskPlayerName>
                                </div>
                            ) : (
                                /* Player name is set */
                                <div className="player-name-created-section">
                                    <div className="joined-player-section">
                                        <JoinedPlayer {...props}></JoinedPlayer>
                                    </div>

                                    {!room.roomCode ? (
                                        /* Ask for room code */
                                        <div className="enter-room-code-section">
                                            <AskGameRoom
                                                {...props}
                                            ></AskGameRoom>
                                        </div>
                                    ) : (
                                        /* Players in you room */
                                        <div className="already-joined-players-section">
                                            <JoinedListPlayer
                                                {...props}
                                            ></JoinedListPlayer>

                                            <EverybodyInButtonPlayer
                                                {...props}
                                            ></EverybodyInButtonPlayer>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </Route>
                </Switch>
            </Router>
        </div>
    );
};

export default WaitingForPlayers;
