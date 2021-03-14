import React, { useEffect, useState } from 'react';

import './style/style.css';

import WaitingForPlayers from './components/WaitingForPlayers/WaitingForPlayers';
import Game from './components/Game';

function App() {
    const [players, setPlayers] = useState([]);
    const [player, setPlayer] = useState({});
    const [room, setRoom] = useState({});
    const [display] = useState(false);

    const getFact = () => {
        if (!display) return;
        console.log('Get fact');
        window.socket.emit('get_fact_to_server', (data) => {
            if (!data.success) {
                console.log('Not success');
                return;
            }
        });
    };

    useEffect(getFact, [room]);

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
