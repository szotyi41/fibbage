import RecommendedAnswers from './RecommendedAnswers.js';
import Fact from './Fact.js';
import YourLie from './YourLie';
import PlayerAnswers from './PlayerAnswers';

const Game = (props) => {
    return (
        <div>
            <Fact></Fact>
            <RecommendedAnswers></RecommendedAnswers>
            <YourLie></YourLie>
            <PlayerAnswers></PlayerAnswers>
        </div>
    );
};

export default Game;
