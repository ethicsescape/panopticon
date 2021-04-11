DROP TABLE IF EXISTS game;
CREATE TABLE game (
    id TEXT NOT NULL PRIMARY KEY,
    hostname TEXT,
    gateway TEXT,
    party TEXT,
    started INTEGER,
    deactivated_attention INTEGER,
    deactivated_movement INTEGER,
    deactivated_risk INTEGER
);

DROP TABLE IF EXISTS player;
CREATE TABLE player (
    game TEXT,
    id TEXT NOT NULL PRIMARY KEY,
    name TEXT,
    mission TEXT,
    FOREIGN KEY (game) REFERENCES game (id)
);

DROP TABLE IF EXISTS decision;
CREATE TABLE decision (
    game TEXT,
    id TEXT NOT NULL PRIMARY KEY,
    rationale TEXT,
    recommendations TEXT,
    suspect TEXT,
    submitted INTEGER,
    deactivated_attention INTEGER,
    deactivated_movement INTEGER,
    deactivated_risk INTEGER,
    FOREIGN KEY (game) REFERENCES game (id)
);

DROP TABLE IF EXISTS clue;
CREATE TABLE clue (
    game TEXT,
    id TEXT,
    unlocked INTEGER,
    by TEXT,
    code TEXT,
    FOREIGN KEY (game) REFERENCES game (id),
    FOREIGN KEY (by) REFERENCES player (id)
);

DROP TABLE IF EXISTS vote;
CREATE TABLE vote (
    game TEXT,
    by TEXT,
    for TEXT,
    mission TEXT,
    FOREIGN KEY (game) REFERENCES game (id),
    FOREIGN KEY (by) REFERENCES player (id),
    FOREIGN KEY (for) REFERENCES player (id)
);

DROP TABLE IF EXISTS hint;
CREATE TABLE hint (
    game TEXT,
    id TEXT,
    FOREIGN KEY (game) REFERENCES game (id)
);

DROP VIEW IF EXISTS valid_game;
CREATE VIEW valid_game AS
SELECT *
FROM game
WHERE
    started IS NOT NULL
    AND hostname == "panopticonsecurity.herokuapp.com"
    AND gateway != "venn"
;

DROP VIEW IF EXISTS completed_game;
CREATE VIEW completed_game AS
SELECT *
FROM valid_game
WHERE EXISTS (
    SELECT 1
    FROM decision
    WHERE valid_game.id == decision.game
);