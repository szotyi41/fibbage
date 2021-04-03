import { useEffect } from 'react';

const ShowGameRoom = ({ room, setRoom }) => {
    // Create room at start
    useEffect(() => {
        console.log('Create room at server');
        window.socket.emit('create_game_room_to_server', {}, (data) => {
            if (!data.success) {
                console.log('Failed to create room', data);
                return;
            }
            setRoom(data.room);
            console.log('Room created: ', data.room);
        });
    }, [setRoom]);

    return (
        <div className="room-code-section">
            <h2>Szobakulcs a csatlakozáshoz</h2>

            <div className="room-code">
                <div className="animate__animated animate__pulse animate__infinite animate__delay-2s">
                    {typeof room.roomCode !== 'undefined' ? (
                        room.roomCode
                    ) : (
                        <i className="fa fa-spinner fa-spin"></i>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShowGameRoom;
