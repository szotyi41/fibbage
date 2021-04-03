import { useEffect } from 'react';

const CategoryChoosePlayer = (props) => {
    const {
        room,
        setRoom,
        player,
        setPlayers,
        category,
        setCategory,
        categories,
        setCategories
    } = props;

    // Subscribe to choose category event
    const waitingForChooseCategory = () => {
        // On get categories
        window.socket.on(
            'waiting_for_choose_category_to_client',
            ({ success, message, room }) => {
                // Failed to get categories, which can a player could choose
                if (!success) {
                    console.log('Failed to get categories', message);
                    return;
                }

                // Get player choosable categories
                setRoom(room);
                setPlayers(room.players);
                setCategories(room.categories);
            }
        );

        // On a player choose category
        window.socket.on(
            'on_choose_category_to_client',
            ({ success, message, room }) => {
                // Error on choose category
                if (!success) {
                    console.log('Failed on player choose category', message);
                    return;
                }

                // Category successfully choosed by a player, show in screen
                setRoom(room);
                setPlayers(room.players);
                setCategory(room.category);
            }
        );
    };

    // Waiting at start
    useEffect(waitingForChooseCategory, [
        setRoom,
        setPlayers,
        setCategory,
        setCategories
    ]);

    // On select category
    const selectCategory = (category) => {
        console.log('Category select started', category);
        window.socket.emit(
            'select_category_to_server',
            { category: category },
            ({ success, message, room }) => {
                // Failed to select category
                if (!success) {
                    console.log('Failed to choose category', message);
                    return;
                }

                // Category selected successfully
                console.log('Category selected successfully', category);
                setRoom(room);
            }
        );
    };

    return (
        <div>
            {/* Category is choosed */}
            {category !== '' ? (
                <div>
                    <h1>
                        {room.playerWhoHaveToChooseCategory.playerName +
                            ' a(z) ' +
                            category +
                            ' kategóriát választotta'}
                    </h1>
                </div>
            ) : (
                <div>
                    {/* Category not choosed yet */}
                    {player.id !== room.playerWhoHaveToChooseCategory.id ? (
                        <div>
                            {/* Show player name who choose category */}
                            <h1>
                                {room.playerWhoHaveToChooseCategory.playerName +
                                    ' választ kategóriát'}
                            </h1>
                        </div>
                    ) : (
                        <div>
                            {/* Show categories to choose */}
                            <h1>Válassz kategóriát</h1>
                            <div>
                                {categories.map((category, categoryIndex) => (
                                    <button
                                        key={categoryIndex}
                                        className="button button-prm"
                                        onClick={() => selectCategory(category)}
                                    >
                                        {category}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CategoryChoosePlayer;
