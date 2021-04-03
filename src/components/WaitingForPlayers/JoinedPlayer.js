const JoinedPlayer = ({ player, setPlayer }) => {
    return (
        <div className="player-profile">
            <img alt=""></img>
            <div className="player-name">{player.playerName}</div>
        </div>
    );
};

export default JoinedPlayer;
