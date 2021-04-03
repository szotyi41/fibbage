import { useState } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import CategoryChoosePlayer from './CategoryChoosePlayer.js';
import CategoryChooseRoom from './CategoryChooseRoom.js';
import ShowFactRoom from './ShowFactRoom.js';
import ShowFactPlayer from './ShowFactPlayer.js';

const Game = (props) => {
    const { room } = props;

    const [fact, setFact] = useState({});
    const [answers, setAnswers] = useState([]);
    const [category, setCategory] = useState('');
    const [categories, setCategories] = useState([]);

    return (
        <div>
            {/* Show room code */}
            <Router>
                <Switch>
                    <Route path="/room">
                        {!room.category ? (
                            <CategoryChooseRoom
                                {...props}
                                category={category}
                                setCategory={setCategory}
                                categories={categories}
                                setCategories={setCategories}
                            ></CategoryChooseRoom>
                        ) : (
                            <ShowFactRoom
                                {...props}
                                fact={fact}
                                setFact={setFact}
                                category={category}
                                setCategory={setCategory}
                                categories={categories}
                                setCategories={setCategories}
                                answers={answers}
                                setAnswers={setAnswers}
                            ></ShowFactRoom>
                        )}
                    </Route>

                    <Route path="/player">
                        {!room.category ? (
                            <CategoryChoosePlayer
                                {...props}
                                category={category}
                                setCategory={setCategory}
                                categories={categories}
                                setCategories={setCategories}
                            ></CategoryChoosePlayer>
                        ) : (
                            <ShowFactPlayer
                                {...props}
                                fact={fact}
                                setFact={setFact}
                                category={category}
                                setCategory={setCategory}
                                categories={categories}
                                setCategories={setCategories}
                                answers={answers}
                                setAnswers={setAnswers}
                            ></ShowFactPlayer>
                        )}
                    </Route>

                    {/* <Fact></Fact>
                    <RecommendedAnswers></RecommendedAnswers>
                    <YourLie></YourLie>
                    <PlayerAnswers></PlayerAnswers> */}
                </Switch>
            </Router>
        </div>
    );
};

export default Game;
