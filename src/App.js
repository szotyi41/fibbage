import React, { useState } from 'react';
import Game from './components/Game/Game';
import WaitingForPlayers from './components/WaitingForPlayers/WaitingForPlayers';
import './style/style.css';

function App() {
    const [players, setPlayers] = useState([]);
    const [player, setPlayer] = useState({});
    const [room, setRoom] = useState({});

    return (
        <div className="App">
            {!room.started ? (
                <WaitingForPlayers
                    players={players}
                    setPlayers={setPlayers}
                    player={player}
                    setPlayer={setPlayer}
                    room={room}
                    setRoom={setRoom}
                ></WaitingForPlayers>
            ) : (
                <Game
                    players={players}
                    setPlayers={setPlayers}
                    player={player}
                    setPlayer={setPlayer}
                    room={room}
                    setRoom={setRoom}
                ></Game>
            )}
        </div>
    );
}

export default App;
