import { useEffect } from 'react';

const CategoryChooseRoom = (props) => {
    const {
        room,
        setRoom,
        setPlayers,
        category,
        setCategory,
        categories,
        setCategories
    } = props;

    useEffect(() => console.log('Room is', room), [room]);

    // Get categories
    const getCategories = () => {
        console.log('Get random categories');
        window.socket.emit(
            'get_categories_to_server',
            {},
            ({ success, message, room }) => {
                // Failed to get categories
                if (!success) {
                    console.log('Failed to get categories: ', message);
                    return;
                }

                // Categories successfully queried
                console.log('Categories queried successfully', room.categories);
                setRoom(room);
                setCategories(room.categories);
            }
        );
    };

    // Subscribe to choose category event
    const waitingForChooseCategory = () => {
        console.log('Waiting for choose category');

        // On get categories
        window.socket.on(
            'waiting_for_choose_category_to_client',
            ({ success, message, room, categories }) => {
                // Failed to get categories, which can a player could choose
                if (!success) {
                    console.log('Failed to get categories', message);
                    return;
                }

                // Get player choosable categories
                console.log('Categories show', room.categories);
                setRoom(room);
                setPlayers(room.players);
                setCategories(categories);
            }
        );

        // On a player choose category
        window.socket.on(
            'on_choose_category_to_client',
            ({ success, message, room, category }) => {
                // Error on choose category
                if (!success) {
                    console.log('Failed on player choose category', message);
                    return;
                }

                // Category successfully choosed by a player, show in screen
                console.log('Category choosed by player', category);
                setRoom(room);
                setPlayers(room.players);
                setCategory(category);
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

    // Get categories at start
    useEffect(getCategories, [setRoom, setCategories]);

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
                    {!room.category ? (
                        <div>
                            {/* Show player name who choose category */}
                            <h1>
                                {room.playerWhoHaveToChooseCategory.playerName +
                                    ' választ kategóriát'}
                            </h1>

                            <span>
                                {categories
                                    .map((category) => category)
                                    .join(', ')}
                            </span>
                        </div>
                    ) : (
                        <div>
                            {/* On choosed category arrived */}
                            <h1>
                                {room.playerWhoHaveToChooseCategory.playerName +
                                    ' a(z) ' +
                                    category +
                                    ' kategóriát választotta'}
                            </h1>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CategoryChooseRoom;
