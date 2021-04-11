# Panopticon Game Data

## Tables

### game

Games played.

| Column | Type | Description |
|:-------|:-----|:------------|
| id | String (TEXT) | Unique game ID. |
| hostname | String (TEXT) | Domain hosting the game. Games with `hostname` of `"panopticonsecurity.herokuapp.com"` are games from the official, live site. |
| gateway | String (TEXT) | Code used to join the game. |
| party | String (TEXT) | Code for leaderboard, if game is part of a party. |
| started | Timestamp (INTEGER) | Timestamp when game started (unix epoch in milliseconds). |
| deactivated_attention | Boolean (INTEGER) | Whether or not the attention system was in the deactivated state when all players left the game. |
| deactivated_movement | Boolean (INTEGER) | Whether or not the movement system was in the deactivated state when all players left the game. |
| deactivated_risk | Boolean (INTEGER) | Whether or not the risk system was in the deactivated state when all players left the game. |

### player

Players from each game.

| Column | Type | Description |
|:-------|:-----|:------------|
| game | String (TEXT) | Key to `game` table. |
| id | String (TEXT) | Unique player ID. |
| name | String (TEXT) | Player screen name. |
| mission | String (TEXT) | ID of player's selected mission. |

### decision

Decisions from each game, if any.

| Column | Type | Description |
|:-------|:-----|:------------|
| game | String (TEXT) | Key to `game` table. |
| id | String (TEXT) | Unique decision ID. |
| rationale | String (TEXT) | User-written content of rationale for decision. |
| recommendations | String (TEXT) | User-written content of recommendations to the store. |
| suspect | String (TEXT) | Chosen suspect. |
| submitted | Timestamp (INTEGER) | Timestamp when the decision was submitted (unix epoch in milliseconds). |
| deactivated_attention | Boolean (INTEGER) | Whether or not the attention system was in the deactivated state when the decision was submitted. |
| deactivated_movement | Boolean (INTEGER) | Whether or not the movement system was in the deactivated state when the decision was submitted. |
| deactivated_risk | Boolean (INTEGER) | Whether or not the risk system was in the deactivated state when the decision was submitted. |

### clue

Clues unlocked in each game, if any. If players do not unlock a clue in a game, it will not have a record in this table.

| Column | Type | Description |
|:-------|:-----|:------------|
| game | String (TEXT) | Key to `game` table. |
| id | String (TEXT) | ID of unlocked clue. |
| unlocked | Timestamp | Timestamp when the clue was unlocked (unix epoch in milliseconds). |
| by | String (TEXT) | ID of player who unlocked the clue. Key to `player` table. |
| code | String (TEXT) | Code used to unlock the clue. |

### vote

Votes during the discussion phase where players try to guess each others' missions, if any. If a player does not vote in a game, they will not have any records in this table.

| Column | Type | Description |
|:-------|:-----|:------------|
| game | String (TEXT) | Key to `game` table. |
| by | String (TEXT) | ID of player who voted. Key to `player` table. |
| for | String (TEXT) | ID of player who the voter thinks had the mission. Key to `player` table. |
| mission | String (TEXT) | ID of mission the voter thinks the other player had. |

### hint

Hints used in each game, if any.

| Column | Type | Description |
|:-------|:-----|:------------|
| game | String (TEXT) | Key to `game` table. |
| id | String (TEXT) | ID of the hint that was used. |

## Views

### valid_game

Same schema as `game`. Excludes test games.

### completed_game

Same schema as `game`. Valid games with at least one submitted decision.

## Export

There are three ways to get the data:

- Receive a copy of the SQLite database file `panopticon.db`.
- Receive the .csv files, then optionally create the SQLite database file (instructions below).
- Receive the access tokens and script, then build all the data (instructions below).

## Rebuild Data

### Create CSV Files

Ask Vinesh for Firebase access tokens and `manage.js` script, neither are committed to the repository.

```bash
mkdir raw
node manage.js download_games
mkdir csv
node manage.js dump_csv
```

### Create SQLite Database File

If the `csv/` folder contains the datasets, you can run these commands:

```bash
virtualenv venv
source venv/bin/activate
pip3 install -r requirements.txt
python3 sql/setup_db.py
cp panopticon.db panopticon-working.db
jupyter notebook
```
