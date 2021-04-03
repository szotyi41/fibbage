# Short Description

This game is a trivia which inspired by fibbage game. You must lie to your
friends to get the most score.

# Game starts with connecting all players to the same room

1. Players: Auth player (connect session ID with player name)
2. Room: Create room
3. Players: Join to room
4. Player, Room: Waiting for other players
5. Player: Send players are ready
6. Player: Press everybody are ready

# Game progress

1. Player: First player choose category
2. Room: The fact show on screen
3. Players: Must type their lies
4. Room: Show recommended answers
5. Players: Select the answer which is look like correct
6. Room: Show scams (Who believe to who?)
7. Room: Show the truth
8. Room: Show current score

# Installation

After pull the project start client and server:

```bash
# Client
cd fibbage
npm install
npm run dev

# Server
cd ./server
nodemon index.js
```

# Dependecies

-   mongodb for database
-   npm nodejs for the server side

# Components

Waiting for players.js

|        | Join to room section                                                                      |
| ------ | ----------------------------------------------------------------------------------------- |
| Room   | ShowGameRoom, JoinedListRoom                                                              |
| Player | AskRoomCodePlayer, AskNamePlayer, JoinedPlayer, JoinedListPlayer, EverybodyInButtonPlayer |

Game.js

|        | Choose category      | Type your answer                                   | Show recommended answers          |
| ------ | -------------------- | -------------------------------------------------- | --------------------------------- |
| Room   | CategoryChooseRoom   | ShowFactRoom, ShowPlayersAnsweredRoom              | ShowFactRoom, ShowAnswersRoom     |
| Player | CategoryChoosePlayer | ShowFactPlayer, ShowFactRoom, TypeYourAnswerPlayer | ShowFactPlayer, ShowAnswersPlayer |
