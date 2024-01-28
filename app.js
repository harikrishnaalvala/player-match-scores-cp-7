const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let database = null;

const app = express();
app.use(express.json());
const initializeDbAndServer = async () => {
  try {
    database = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log("Server is running on http://localhost:3000");
    });
  } catch (error) {
    console.log(`DataBase error is ${error}`);
    process.exit(1);
  }
};
initializeDbAndServer();

//API 1
//Returns a list of all the players in the player table
const convertDbObjectAPI1 = (objectItem) => {
  return {
    playerId: objectItem.player_id,
    playerName: objectItem.player_name,
  };
};
app.get("/players/", async (request, response) => {
  const getAllPlayersQuery = `select * from player_details;`;
  const getAllPlayersQueryResponse = await database.all(getAllPlayersQuery);
  response.send(
    getAllPlayersQueryResponse.map((eachPlayer) =>
      convertDbObjectAPI1(eachPlayer)
    )
  );
});

//API 2
// Returns a specific player based on the player ID

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerByIdQuery = `select * from player_details where player_id = ${playerId};`;
  const getPlayerByIdQueryResponse = await database.get(getPlayerByIdQuery);
  response.send(convertDbObjectAPI1(getPlayerByIdQueryResponse));
});

//API 3
// Updates the details of a specific player based on the player ID

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `update player_details set 
  player_name = '${playerName}' where player_id = ${playerId};`;
  const updatePlayerQueryResponse = await database.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//API 4
//Returns the match details of a specific match
const convertDbObjectAPI4 = (objectItem) => {
  return {
    matchId: objectItem.match_id,
    match: objectItem.match,
    year: objectItem.year,
  };
};
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetailsQuery = `select * from match_details where match_id = ${matchId};`;
  const getMatchDetailsQueryResponse = await database.get(getMatchDetailsQuery);
  response.send(convertDbObjectAPI4(getMatchDetailsQueryResponse));
});

// API 5
// Returns a list of all the matches of a player
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchesOfPlayerQuery = `select match_id from player_match_score where 
  player_id = ${playerId};`;
  const getMatchesOfPlayer = await database.all(getMatchesOfPlayerQuery);
  //get player ids array
  const matchIdsArray = getMatchesOfPlayer.map((eachMatch) => {
    return eachMatch.match_id;
  });
  //console.log(`${matchIdsArray}`);
  const getMatchDetailsQuery = `select * from match_details where match_id in (${matchIdsArray});`;
  const getMatchDetails = await database.all(getMatchDetailsQuery);
  response.send(
    getMatchDetails.map((eachMach) => convertDbObjectAPI4(eachMach))
  );
});

//API 6
// Returns a list of players of a specific match
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayersQuery = `
    SELECT
      *
    FROM player_match_score
      NATURAL JOIN player_details
    WHERE
      match_id = ${matchId};`;
  const playersArray = await database.all(getMatchPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) => convertDbObjectAPI1(eachPlayer))
  );
});

//API 7
//Returns the statistics of the total score, fours, sixes of a specific player based on the player ID
const convertDbObjectAPI7 = (playerName, objectItem) => {
  return {
    playerId: objectItem.player_id,
    playerName: playerName,
    totalScore: objectItem.totalScore,
    totalFours: objectItem.totalFours,
    totalSixes: objectItem.totalSixes,
  };
};
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerNameQuery = `select player_name from player_details where player_id = ${playerId};`;
  const getPlayerName = await database.get(getPlayerNameQuery);
  const getPlayerStatsQuery = `select player_id,
  sum(score) as totalScore, sum(fours) as totalFours , sum(sixes) as totalSixes from 
  player_match_score where player_id = ${playerId};`;
  const getPlayerStats = await database.get(getPlayerStatsQuery);
  response.send(convertDbObjectAPI7(getPlayerName.player_name, getPlayerStats));
});

module.exports = app;
