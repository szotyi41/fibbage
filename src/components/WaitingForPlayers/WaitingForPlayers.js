import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';

import AskGameRoom from './AskGameRoom';
import AskPlayerName from './AskPlayerName';
import JoinedPlayerList from './JoinedPlayerList';
import JoinedPlayer from './JoinedPlayer';
import ShowGameRoom from './ShowGameRoom';
import EverybodyIn from './EverybodyIn';

const WaitingForPlayers = (props) => {
    const { player } = props;

    return (
        <div className="waiting-for-players-content">
            <Router>
                <Switch>
                    {/* Show room code */}
                    <Route path="/room">
                        <div className="room-screen">
                            <ShowGameRoom {...props}></ShowGameRoom>
                            <JoinedPlayerList {...props}></JoinedPlayerList>
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

                                    {!player.room ? (
                                        /* Ask for room code */
                                        <div className="enter-room-code-section">
                                            <AskGameRoom
                                                {...props}
                                            ></AskGameRoom>
                                        </div>
                                    ) : (
                                        /* Players in you room */
                                        <div className="already-joined-players-section">
                                            <JoinedPlayerList
                                                {...props}
                                            ></JoinedPlayerList>

                                            <EverybodyIn
                                                {...props}
                                            ></EverybodyIn>
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
