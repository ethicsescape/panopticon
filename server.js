const express = require("express");
const cors = require("cors");
const app = express();
const fs = require("fs");
const dotenv = require("dotenv");
const firebase = require("firebase-admin");
const {google} = require('googleapis');

dotenv.config();

const serviceAccount = {
    type: process.env.FIREBASE_CREDENTIAL_type,
    project_id: process.env.FIREBASE_CREDENTIAL_project_id,
    private_key_id: process.env.FIREBASE_CREDENTIAL_private_key_id,
    private_key: process.env.FIREBASE_CREDENTIAL_private_key.replace(/\\n/g, "\n"),
    client_email: process.env.FIREBASE_CREDENTIAL_client_email,
    client_id: process.env.FIREBASE_CREDENTIAL_client_id,
    auth_uri: process.env.FIREBASE_CREDENTIAL_auth_uri,
    token_uri: process.env.FIREBASE_CREDENTIAL_token_uri,
    auth_provider_x509_cert_url: process.env.FIREBASE_CREDENTIAL_auth_provider_x509_cert_url,
    client_x509_cert_url: process.env.FIREBASE_CREDENTIAL_client_x509_cert_url
};

const firebaseConfig = {
    credential: firebase.credential.cert(serviceAccount),
    apiKey: process.env.FIREBASE_SECRET_apiKey,
    authDomain: process.env.FIREBASE_SECRET_authDomain,
    databaseURL: process.env.FIREBASE_SECRET_databaseURL,
    projectId: process.env.FIREBASE_SECRET_projectId,
    storageBucket: process.env.FIREBASE_SECRET_storageBucket,
    messagingSenderId: process.env.FIREBASE_SECRET_messagingSenderId,
    appId: process.env.FIREBASE_SECRET_appId
};

firebase.initializeApp(firebaseConfig);

const db = firebase.database();

const ROOT = "panopticon";

const allowedDomains = [
    "http://panopticonsecurity.glitch.me",
    "https://panopticonsecurity.glitch.me",
    "http://localhost:4000",
    "https://localhost:4000",
    "http://ethicsescape.github.io",
    "https://ethicsescape.github.io"
];

const animalNames = [
    "axolotl",
    "buffalo",
    "capybara",
    "dragonfly",
    "emu",
    "ferret",
    "goose",
    "hyena",
    "impala",
    "jaguar",
    "kangaroo",
    "leopard",
    "manatee",
    "newt",
    "octopus",
    "penguin",
    "quetzal",
    "rhinoceros",
    "seahorse",
    "tortoise",
    "uguisu",
    "vulture",
    "walrus",
    "xerus",
    "yak",
    "zebra"
];

const DRIVE_CREDENTIALS = {
    "client_id": process.env.GOOGLE_API_client_id,
    "project_id": process.env.GOOGLE_API_project_id,
    "auth_uri": process.env.GOOGLE_API_auth_uri,
    "token_uri": process.env.GOOGLE_API_token_uri,
    "auth_provider_x509_cert_url": process.env.GOOGLE_API_auth_provider_x509_cert_url,
    "client_secret": process.env.GOOGLE_API_client_secret,
};

const DRIVE_SCOPES = [
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/drive.file"
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedDomains.indexOf(origin) > -1) {
            callback(null, true);
        } else {
            callback(new Error(`Origin not permitted access to Panopticon Server: ${origin}`));
        }
    }
}));

app.use(express.static("public"));

app.get("/", (request, response) => {
    response.send({ success: true, message: "You have reached a Panopticon game server." });
});

app.get("/api/unlock/:clueid", (request, response) => {
    const clueId = request.params.clueid;
    const code = request.query.code.toLowerCase();
    const gameId = request.query.game;
    const userId = request.query.user;
    if (gameId && userId) {
            const ref = db.ref(`${ROOT}/games/${gameId}/unlocked/${clueId}`);
            ref.once("value", (snap) => {
                if (snap.val()) {
                    response.send({ success: true });
                } else {
                    ref.set({
                        code: code,
                        by: userId,
                        at: firebase.database.ServerValue.TIMESTAMP
                    }).then(() => {
                        response.send({ success: true });
                    }).catch((err) => {
                        response.send({ success: false, error: err });
                    });
                }
            });
    } else {
        response.send({ success: false, message: "Missing gameId or userId." });
    }
});

app.get("/api/lookup", (request, response) => {
    const email = request.query.email;
    if (email && email.toLowerCase() === "topquarterback95@gmail.com") {
        const customer = [
            "Customer Found:",
            "Name: James Rhule",
            "Street: 1973 Central Lane",
            "City: Philadelphia",
            "State: PA",
            "Country: USA",
            "Phone: (267) 382-1984"
        ];
        response.send({ success: true, message: customer.join("\n") });
    } else {
        response.send({ success: false, message: `No records found for ${email}.` });
    }
});

app.get("/api/game/create", (request, response) => {
    const gatewayRaw = request.query.gateway;
    if (gatewayRaw) {
        const gateway = gatewayRaw.toLowerCase();
        db.ref(`${ROOT}/access/${gateway}`).once("value", (snap) => {
            const accessData = snap.val() || false;
            if (!accessData) {
                response.send({ success: false, message: "Game access code not found." });
            } else {
                if (accessData.reusable) {
                    const ref = db.ref(`${ROOT}/games`).push({
                        exists: true,
                        hostname: request.hostname,
                        gateway: gateway
                    });
                    const gameId = ref.key;
                    response.send({ success: true, gameId });
                } else {
                    if (accessData.game) {
                        response.send({ success: true, gameId: accessData.game });
                    } else {
                        const ref = db.ref(`${ROOT}/games`).push({
                            exists: true,
                            hostname: request.hostname,
                            gateway: gateway
                        });
                        const gameId = ref.key;
                        db.ref(`${ROOT}/access/${gateway}/game`).set(gameId).then((done) => {
                            response.send({ success: true, gameId });    
                        }).catch((err) => {
                            response.send({ success: false, message: "Failed to create game. Please try again.", err });
                        });
                    }
                }
            }
        });
    } else {
        response.send({ success: false, message: "Please enter a game access code." });
    }
});

app.get("/api/game/fetch/:gameid", (request, response) => {
    const gameId = request.params.gameid;
    db.ref(`${ROOT}/games/${gameId}`).once("value", (snap) => {
        const data = snap.val();
        response.send({success: true, data });
    });
});

function setScreenName(gameId, userId, name, override) {
    return new Promise((resolve, reject) => {
        const screenName = name.substr(0, 10).toUpperCase();
        const ref = db.ref(`${ROOT}/games/${gameId}/names/${userId}`);
        db.ref(`${ROOT}/games/${gameId}/names`).once("value", (snap) => {
            const nameMap = snap.val();
            if (nameMap && userId in nameMap) {
                const invertedMap = Object.keys(nameMap).reduce((agg, uid) => {
                    agg[nameMap[uid]] = uid;
                    return agg;
                }, {});
                if (screenName in invertedMap && invertedMap[screenName] !== userId) {
                    reject(`Name ${screenName} is already taken.`);
                } else if (override) {
                    ref.set(screenName).then(() => {
                        resolve(screenName);
                    }).catch(reject);  
                } else {
                    resolve(screenName);
                }
            } else {
                ref.set(screenName).then(() => {
                    resolve(screenName);
                }).catch(reject);  
            }
        });
    });
}

app.get("/api/game/join/:gameid", (request, response) => {
    const gameId = request.params.gameid;
    const newUser = request.query.new === "true";
    const randomIndex = Math.floor(Math.random() * animalNames.length);
    const randomName = animalNames[randomIndex];
    if (!newUser) {
        const userId = request.query.user;
        const ref = db.ref(`${ROOT}/games/${gameId}/users/${userId}`).set(true).then(() => {
            setScreenName(gameId, userId, randomName, false);
            response.send({ success: true, userId });
        }).catch((err) => {
            response.send({ success: false, err: err });
        });
    } else {
        const ref = db.ref(`${ROOT}/games/${gameId}/users`).push(true);
        const userId = ref.key;
        setScreenName(gameId, userId, randomName, false);
        response.send({ success: true, userId }); 
    }
});

app.get("/api/name/:gameid", (request, response) => {
    const gameId = request.params.gameid;
    const userId = request.query.user;
    const name = request.query.name;
    if (gameId && userId && name) {
        setScreenName(gameId, userId, name, true).then((screenName) => {
            response.send({ success: true, name: screenName });
        }).catch((err) => {
            response.send({ success: false, message: err });
        });
    } else {
        response.send({ success: false, message: "Missing game ID, user ID, or screen name." }); 
    }
});

app.get("/api/mission/toggle/:gameid", (request, response) => {
    const gameId = request.params.gameid;
    const userId = request.query.user;
    const missionId = request.query.mission;
    if (gameId && userId && missionId) {
        db.ref(`${ROOT}/games/${gameId}/started`).once("value", (startSnap) => {
            const hasStarted = startSnap.val() !== null;
            const ref = db.ref(`${ROOT}/games/${gameId}/missions/${userId}`);
            db.ref(`${ROOT}/games/${gameId}/missions`).once("value", (snap) => {
                const val = snap.val() || {};
                const invertedMap = Object.keys(val).reduce((agg, k) => {
                    agg[val[k]] = k;
                    return agg;
                }, {});
                if (val[userId] === missionId) {
                    if (!hasStarted) {
                        ref.remove().then(() => {
                            response.send({ success: true });
                        }).catch((err) => {
                            response.send({ success: false, err: err });
                        });
                    } else {
                        response.send({ success: false, message: "You can't drop a mission after the game has started." });
                    }
                } else if (missionId in invertedMap) {
                    response.send({ success: false, message: "Someone else has already taken that mission." });
                } else if (!(userId in val) || !hasStarted) {
                    ref.set(missionId).then(() => {
                        response.send({ success: true });
                    }).catch((err) => {
                        response.send({ success: false, err: err });
                    });
                } else {
                    response.send({ success: false, message: "You can't change missions after the game has started." });
                }
            });
        });
    } else {
        response.send({ success: false, message: "Missing game ID, user ID, or mission ID." }); 
    }
});

app.get("/api/game/leave/:gameid", (request, response) => {
    const gameId = request.params.gameid;
    const userId = request.query.user;
    db.ref(`${ROOT}/games/${gameId}/users/${userId}`).remove().then(() => {
        db.ref(`${ROOT}/games/${gameId}`).once("value", (snap) => {
            const val = snap.val() || {};
            const notStarted = !("started" in val);
            const noUsers = !("users" in val);
            if (notStarted && noUsers) {
                db.ref(`${ROOT}/games/${gameId}`).remove().then(() => {
                    response.send({ success: true });
                }).catch((err) => {
                    response.send({ success: true });
                });
            } else {
                response.send({ success: true });
            }
        });
    }).catch((err) => {
        response.send({ success: false, err: err });
    });
});

app.get("/api/game/start/:gameid", (request, response) => {
    const gameId = request.params.gameid;
    db.ref(`${ROOT}/games/${gameId}/started`).once("value", (snap) => {
        if (snap.val()) {
            // Already started.
            response.send({ success: true });
        } else {
            db.ref(`${ROOT}/games/${gameId}/started`).set(firebase.database.ServerValue.TIMESTAMP).then(() => {
                response.send({ success: true });
            }).catch((err) => {
                response.send({ success: false, err: err });
            });
        }
    });
});

app.get("/api/game/decide/:gameid", (request, response) => {
    const gameId = request.params.gameid;
    const suspect = request.query.suspect;
    const rationale = request.query.rationale;
    const recommendations = request.query.recommendations;
    db.ref(`${ROOT}/games/${gameId}`).once("value", (snap) => {
        const data = snap.val() || {};
        const decision = {
            suspect,
            rationale,
            recommendations,
            systems: data.systems || {},
            unlocked: data.unlocked || {},
            timestamp: firebase.database.ServerValue.TIMESTAMP,
        };
        db.ref(`${ROOT}/games/${gameId}/decisions`).push(decision).then(() => {
            response.send({ success: true });
        }).catch((err) => {
            response.send({ success: false, err: err });
        });
    });
});

app.get("/api/game/toggle/:gameid", (request, response) => {
    const gameId = request.params.gameid;
    const systemId = request.query.system;
    db.ref(`${ROOT}/games/${gameId}/systems/${systemId}`).once("value", (snap) => {
        const state = snap.val() == null ? true : snap.val();
        db.ref(`${ROOT}/games/${gameId}/systems/${systemId}`).set(!state).then(() => {
            response.send({ success: true });
        }).catch((err) => {
            response.send({ success: false, err: err });
        });
    });
});

app.get("/api/discussion/start/:gameid", (request, response) => {
    const gameId = request.params.gameid;
    if (gameId) {
        db.ref(`${ROOT}/games/${gameId}/discussion/active`).set(true).then(() => {
            response.send({ success: true });
        }).catch((err) => {
            response.send({ success: false, err: err });
        });
    } else {
        response.send({ success: false, message: "Missing gameId." });
    }
});

app.get("/api/discussion/skip/:gameid", (request, response) => {
    const gameId = request.params.gameid;
    const userId = request.query.user;
    if (gameId && userId) {
        db.ref(`${ROOT}/games/${gameId}/discussion/skipped/${userId}`).set(true).then(() => {
            response.send({ success: true });
        }).catch((err) => {
            response.send({ success: false, err: err });
        });
    } else {
        response.send({ success: false, message: "Missing gameId or userId." });
    }
});

app.get("/api/discussion/vote/:gameid", (request, response) => {
    const gameId = request.params.gameid;
    const userId = request.query.user;
    const voteRawData = request.query.vote;
    if (gameId && userId && voteRawData) {
        let voteData;
        try {
            voteData = JSON.parse(voteRawData);
        } catch (err) {
            response.send({ success: false, message: `Failed to parse vote data: ${err}` });
        }
        const ref = db.ref(`${ROOT}/games/${gameId}/discussion/votes/${userId}`);
        ref.once("value", (snap) => {
            if (snap.val()) {
                response.send({ success: false, message: "You already submitted your vote." });
            } else {
                ref.set(voteData).then(() => {
                    response.send({ success: true, message: "Successfully submitted your vote!" });
                }).catch((err) => {
                    response.send({ success: false, err: err });
                });
            }
        });
    } else {
        response.send({ success: false, message: "Missing gameId, userId, or vote data." });
    }
});

/**
 * Based on Quickstart: https://developers.google.com/docs/api/quickstart/nodejs
 */
function getAuthUrl(redirectUrl) {
    return new Promise((resolve, reject) => {
        const {client_secret, client_id} = DRIVE_CREDENTIALS;
        const oAuth2Client = new google.auth.OAuth2(
                client_id, client_secret, redirectUrl);
        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: "offline",
            scope: DRIVE_SCOPES,
        });
        resolve(authUrl);
    });
}

/**
 * Based on Quickstart: https://developers.google.com/docs/api/quickstart/nodejs
 */
function createNotepad(redirectUrl, code) {
    return new Promise((resolve, reject) => {
        const {client_secret, client_id} = DRIVE_CREDENTIALS;
        const oAuth2Client = new google.auth.OAuth2(
                client_id, client_secret, redirectUrl);
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return reject(err);
            oAuth2Client.setCredentials(token);
            const drive = google.drive({version: "v3", auth: oAuth2Client});
            drive.files.copy({
                fileId: NOTEPAD_FILE_ID,
            }, (err, fileRes) => {
                if (err) return reject(err);
                drive.permissions.create({
                    fileId: fileRes.data.id,
                    resource: {
                        role: "writer",
                        type: "anyone",
                        value: "anyone",
                        withLink: true
                    }
                }, (err, permRes) => {
                    if (err) return reject(err);
                    resolve(fileRes.data.id);
                });
            });
        });
    });
}

const NOTEPAD_FILE_ID = "1Nt1m6yHxT6oTDLtRUzYTkSsvR7ZkwXkp_FdiSfyYBTg";
const FAILURE_DRIVE_PERMISSION = "Sorry, we didn't get your permission. Try reloading or using a different Google account.";

app.get("/api/notepad/authorize/:gameid", (request, response) => {
    const gameId = request.params.gameid;
    const redirectUrl = request.query.redirect;
    if (gameId && redirectUrl) {
        getAuthUrl(redirectUrl).then((authUrl) => {
            response.send({
                success: true,
                message: "Redirecting you to get your permission to create a Google Doc.",
                url: authUrl
            });
        }).catch((err) => {
            response.send({ success: false, message: FAILURE_DRIVE_PERMISSION, err: err });
        });
    } else {
        response.send({ success: false, message: "Missing gameId or redirectUrl." });
    }
});

app.get("/api/notepad/create/:gameid", (request, response) => {
    const gameId = request.params.gameid;
    const authCode = request.query.code;
    const redirectUrl = request.query.redirect;
    if (gameId && authCode) {
        createNotepad(redirectUrl, authCode).then((fileId) => {
            db.ref(`${ROOT}/games/${gameId}/doc`).set(fileId).then(() => {
                response.send({ success: true, message: "Successfully created your team's shared notepad. Reloading the page..." });
            }).catch((err) => {
                response.send({ success: false, message: FAILURE_DRIVE_PERMISSION, err: err });
            });
        }).catch((err) => {
            response.send({ success: false, message: FAILURE_DRIVE_PERMISSION, err: err });
        });
    } else {
        response.send({ success: false, message: "Missing gameId or authCode." });
    }
});

const listener = app.listen(process.env.PORT, () => {
    console.log("Your app is listening on port " + listener.address().port);
});
