import { useState } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import CategoryChoosePlayer from './CategoryChoosePlayer.js';
import CategoryChooseRoom from './CategoryChooseRoom.js';
import ShowFactRoom from './ShowFactRoom.js';
import ShowFactPlayer from './ShowFactPlayer.js';
import ShowResultsPlayer from './ShowResultsPlayer.js';
import ShowResultsRoom from './ShowResultsRoom.js';

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
                            /* Choose category */
                            <CategoryChooseRoom
                                {...props}
                                category={category}
                                setCategory={setCategory}
                                categories={categories}
                                setCategories={setCategories}
                            ></CategoryChooseRoom>
                        ) : (
                            <div>
                                {!room.showResults ? (
                                    /* Show fact */
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
                                ) : (
                                    /* Show results */
                                    <ShowResultsRoom
                                        {...props}
                                        fact={fact}
                                        setFact={setFact}
                                        category={category}
                                        setCategory={setCategory}
                                        categories={categories}
                                        setCategories={setCategories}
                                        answers={answers}
                                        setAnswers={setAnswers}
                                    ></ShowResultsRoom>
                                )}
                            </div>
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
                            <div>
                                {!room.showResults ? (
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
                                ) : (
                                    /* Show results */
                                    <ShowResultsPlayer
                                        {...props}
                                        fact={fact}
                                        setFact={setFact}
                                        category={category}
                                        setCategory={setCategory}
                                        categories={categories}
                                        setCategories={setCategories}
                                        answers={answers}
                                        setAnswers={setAnswers}
                                    ></ShowResultsPlayer>
                                )}
                            </div>
                        )}
                    </Route>
                </Switch>
            </Router>
        </div>
    );
};

export default Game;
