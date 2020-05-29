/*
 global window
 global showdown
 global html_beautify
 global encodeURIComponent
 global firebase
 */

/*
 * From StackOverflow:
 * https://stackoverflow.com/questions/35294633/what-is-the-vanilla-js-version-of-jquerys-getjson/35294675
 */
function fetch(url) {
    return new Promise((resolve, reject) => {
        let request = new XMLHttpRequest();
        request.open("GET", url, true);
        request.onload = function() {
            if (request.status >= 200 && request.status < 400) {
                let data = JSON.parse(request.responseText);
                resolve(data);
            } else {
                reject(request.responseText);
            }
        };
        request.onerror = function(err) {
            reject(err);
        };
        request.send();
    });
}

function showDocumentViewer(content) {
    const contentEl = document.querySelector("[data-view=viewer]");
    const converter = new showdown.Converter({
        tables: true,
    });
    const html = converter.makeHtml(content);
    contentEl.innerHTML = html_beautify(html);
    contentEl.classList.remove("hidden");
}

function showMessage(messageEl, isSuccess, message) {
    if (isSuccess) {
        if (messageEl.classList.contains("failure")) {
            messageEl.classList.remove("failure");
        }
        messageEl.classList.add("success");  
    } else {
        if (messageEl.classList.contains("success")) {
            messageEl.classList.remove("success");
        }
        messageEl.classList.add("failure");
    }
    messageEl.innerText = message;
}

function getViewId() {
    if (window.location.origin.indexOf("ethicsescape.github.io") > -1) {
        if (window.location.pathname.split("/")[2]) {
            return window.location.pathname.split("/")[2];
        }
        return "home";
    }
    if (window.location.pathname.split("/")[1]) {
        return window.location.pathname.split("/")[1];
    }
    return "home";
}

function getClueId() {
    if (window.location.origin.indexOf("ethicsescape.github.io") > -1) {
        if (window.location.pathname.split("/")[3]) {
            return window.location.pathname.split("/")[3];
        }
        return undefined;
    }
    if (window.location.pathname.split("/")[2]) {
        return window.location.pathname.split("/")[2];
    }
    return undefined;
}

if (window.firebase) {
    const firebaseConfig = {
        apiKey: "AIzaSyAQT7XBXuJ2eZk4xnb1y5xNxPZC1POe0Lo",
        authDomain: "ethicsescape.firebaseapp.com",
        databaseURL: "https://ethicsescape.firebaseio.com",
        projectId: "ethicsescape",
        storageBucket: "ethicsescape.appspot.com",
        messagingSenderId: "904305357136",
        appId: "1:904305357136:web:5b279c0a42342614253c55"
    };
    firebase.initializeApp(firebaseConfig);
}
const db = window.firebase ? firebase.database() : false;

const GAME_PROPERTY = "panopticon_game_id";
const USER_PROPERTY = "panopticon_user_id";
const FIREBASE_ROOT = "panopticon";
const API_ROOT = "https://panopticonsecurity.glitch.me";
const SITE_ROOT = window.location.origin.indexOf("localhost") > -1 ? window.location.origin : `${window.location.origin}/panopticon`;

const viewId = getViewId();
console.log(viewId);
const viewEl = document.querySelector(`[data-view=${viewId}]`);
const tabEl = document.querySelector(`[data-tab=${viewId}]`);
if (viewEl) {
    viewEl.classList.remove("hidden");  
}
if (tabEl) {
    tabEl.classList.add("selected");  
}

if (viewId === "document") {
    const clueId = getClueId();
    console.log(clueId);
    fetch(`${API_ROOT}/load/${clueId}`).then((res) => {
        if (res.success) {
            showDocumentViewer(res.content); 
        } else {
            const errorEl = document.querySelector("[data-view=error]");
            const messageEl = errorEl.querySelector(".message");
            messageEl.classList.add("failure");
            messageEl.innerText = res.message;
            errorEl.classList.remove("hidden");
        }
    }).catch((err) => {
        console.log(err);
    });
}

if (viewId === "secure") {
    const clueId = getClueId();
    console.log(clueId);
    const input = document.querySelector("[data-view=secure] input");
    const button = document.querySelector("[data-view=secure] button");
    const messageEl = document.querySelector("[data-view=secure] .message");
    input.focus();
    const accessDocument = () => {
        const accessCode = input.value;
        const gameId = localStorage.getItem(GAME_PROPERTY);
        fetch(`${API_ROOT}/access/${clueId}?code=${accessCode}&game=${gameId}`).then((res) => {
            console.log(res);
            if (res.success) {
                if (messageEl.classList.contains("failure")) {
                    messageEl.classList.remove("failure");
                }
                messageEl.classList.add("success");
                const isLink = res.content.indexOf("http") === 0;
                if (isLink) {
                    const linkEl = document.createElement("a");
                    linkEl.href = res.content;
                    linkEl.target = "_blank";
                    linkEl.innerText = "Access granted. Click here.";
                    messageEl.innerText = "";
                    messageEl.appendChild(linkEl);
                } else {
                    let countdown = 3;
                    messageEl.innerText = `Access granted, loading in ${countdown}...`;
                    const interval = setInterval(() => {
                        countdown--;
                        if (countdown === 0) {
                            clearInterval(interval);
                            viewEl.classList.add("hidden");
                            showDocumentViewer(res.content);  
                        }
                        messageEl.innerText = `Access granted, loading in ${countdown}...`;
                    }, 1000);
                }
            } else {
                messageEl.classList.add("failure");
                messageEl.innerText = res.message;
            }
        }).catch((err) => {
            console.log(err);
        });
    }
    button.addEventListener("click", accessDocument);
    input.addEventListener("keypress", (e) => {
        if (e.keyCode === 13) {
            accessDocument();
        }
    });
}

if (viewId === "activate") {
    const input = document.querySelector("[data-view=activate] input");
    const button = document.querySelector("[data-view=activate] button");
    const messageEl = document.querySelector("[data-view=activate] .message");
    const processOffer = () => {
        const code = input.value.toLowerCase();
        if (code === "noble"){
            showMessage(messageEl, false, "This offer code has already been redeemed. Your store is currently a member of the Watchful Eye Data Sharing program.");
        } else {
            showMessage(messageEl, false, "Invalid offer code.");
        }
    }
    button.addEventListener("click", processOffer);
    input.addEventListener("keypress", (e) => {
        if (e.keyCode === 13) {
            processOffer();
        }
    });
    const renderSystem = (systemId, isActive) => {
        const sectionEl = document.querySelector(`[data-system=${systemId}]`);
        const colorEl = sectionEl.querySelector(".message");
        const statusEl = sectionEl.querySelector(".status");
        const verbEl = sectionEl.querySelector(".button .verb");
        if (isActive) {
            if (colorEl.classList.contains("failure")) {
                colorEl.classList.remove("failure");
            }
            colorEl.classList.add("success");
            statusEl.innerText = "ACTIVE";
            verbEl.innerText = "Deactivate";
        } else {
            if (colorEl.classList.contains("success")) {
                colorEl.classList.remove("success");
            }
            colorEl.classList.add("failure");
            statusEl.innerText = "INACTIVE";
            verbEl.innerText = "Activate";
        }
    }
    const sysMessageEl = document.querySelector("#systems-message");
    const gameId = localStorage.getItem(GAME_PROPERTY);
    if (gameId) {
        const systemIds = ["risk", "movement", "attention"];
        if (db) {
            db.ref(`${FIREBASE_ROOT}/games/${gameId}`).on("value", (snap) => {
                const data = snap.val() || {};
                if (data.systems) {
                    for (let systemId in data.systems) {
                        renderSystem(systemId, data.systems[systemId]);
                    }
                }
            });
        }
        systemIds.forEach((systemId) => {
            const sectionEl = document.querySelector(`[data-system=${systemId}]`);
            const colorEl = sectionEl.querySelector(".message");
            const statusEl = sectionEl.querySelector(".status");
            const toggleEl = sectionEl.querySelector(".button");
            toggleEl.addEventListener("click", (e) => {
                const entered = prompt(`DANGER: Are you sure you want to deactivate the ${systemId} layer? Type "${systemId}" to confirm.`);
                if (entered === systemId) {
                    fetch(`${API_ROOT}/api/game/toggle/${gameId}?system=${systemId}`).then((res) => {
                        if (res.success) {
                            showMessage(sysMessageEl, true, `Operation confirmed. Successfully updated ${systemId}.`);
                        } else {
                            showMessage(sysMessageEl, false, `Failed to update ${systemId}. Contact the game master.`);
                        }
                    }).catch((err) => {
                        showMessage(sysMessageEl, false, `Failed to update ${systemId}. Contact the game master.`);
                    });
                } else {
                    showMessage(sysMessageEl, false, `Operation not confirmed. Did not update ${systemId}.`);
                }
            });
        });
    } else {
        showMessage(sysMessageEl, false, "You are not currently part of a game. Go back to the lobby or ask your teammates for a join link.");
    }
}

const validSuspects = {
    "Shopper #6712": true,
    "Shopper #1263": true,
    "Shopper #6950": true,
    "Shopper #3679": true,
    "Shopper #6871": true,
    "Shopper #5564": true,
    "Shopper #6362": true,
    "Shopper #1943": true,
    "Shopper #2193": true,
    "Shopper #3491": true
};

if (viewId === "decision") {
    const select = document.querySelector("[data-view=decision] select");
    const textareaRat = document.querySelector("#rationale");
    const textareaRec = document.querySelector("#recommendations");
    const secretFormEl = document.querySelector("#secret-form");
    const button = document.querySelector("[data-view=decision] button");
    const messageEl = document.querySelector("[data-view=decision] .message");
    const processDecision = () => {
        if (messageEl.classList.contains("failure")) {
            messageEl.classList.remove("failure");
        }
        messageEl.innerText = "";
        const suspect = select.value;
        if (!(suspect in validSuspects)) {
            messageEl.classList.add("failure");
            messageEl.innerText = "Please select a valid suspect.";
            return;
        }
        const rationale = textareaRat.value;
        if (rationale.split(" ").length < 5) {
            messageEl.classList.add("failure");
            messageEl.innerText = "Please provide a more detailed rationale.";
            return;
        }
        if (secretFormEl.classList.contains("hidden")) {
            secretFormEl.classList.remove("hidden");
            return
        }
        const recommendations = textareaRec.value;
        if (recommendations.split(" ").length < 5) {
            messageEl.classList.add("failure");
            messageEl.innerText = "Please provide more detailed recommendations.";
            return;
        }
        const gameId = localStorage.getItem(GAME_PROPERTY);
        const query = `suspect=${encodeURIComponent(suspect)}&rationale=${encodeURIComponent(rationale)}&recommendations=${encodeURIComponent(recommendations)}`;
        fetch(`${API_ROOT}/api/game/decide/${gameId}?${query}`).then((res) => {
            if (res.success) {
                messageEl.classList.add("success");
                messageEl.innerText = "Successfully submitted. Please contact the game master for further instructions.";
            } else {
                messageEl.classList.add("failure");
                messageEl.innerText = "Failed to submit. Contact the game master.";
            }
        }).catch((err) => {
            messageEl.classList.add("failure");
            messageEl.innerText = "Failed to submit. Contact the game master.";
        });
    };
    button.addEventListener("click", processDecision);
}

function doJoin() {
    if (window.location.href.indexOf("?game=") > -1) {
        const linkGameId = window.location.href.split("?game=")[1];
        localStorage.setItem(GAME_PROPERTY, linkGameId);
    }
    const gameId = localStorage.getItem(GAME_PROPERTY);
    if (!gameId) {
        console.log("Invalid game ID.");
        return;
    }
    document.querySelector("[data-view=join]").classList.remove("hidden");
    document.querySelector("#create-game").classList.add("hidden");
    const gameLinkEl = document.querySelector("#game-link");
    gameLinkEl.innerText = `${SITE_ROOT}/join?game=${gameId}`;
    const lobbyStatusEl = document.querySelector("#lobby-status");
    if (db) {
        db.ref(`${FIREBASE_ROOT}/games/${gameId}`).on("value", (snap) => {
            const data = snap.val() || {};
            const users = data.users || {};
            const numberOfUsers = Object.keys(users).length;
            const gameStarted = "started" in data;
            const gameMessage = gameStarted ? "Game has started, enter!" : "Game has not yet started.";
            const userMessage = `${gameStarted ? "Game" : "Lobby"} has ${numberOfUsers} player${numberOfUsers === 1 ? "" : "s"}.`;
            showMessage(lobbyStatusEl, gameStarted || numberOfUsers > 1, `${gameMessage} ${userMessage}`);
        });
    }
    const startBtn = document.querySelector("#start-game");
    const leaveBtn = document.querySelector("#leave-game");
    if (!localStorage.hasOwnProperty(USER_PROPERTY)) {
        fetch(`${API_ROOT}/api/game/join/${gameId}?new=true`).then((res) => {
            if (res.success) {
                localStorage.setItem(USER_PROPERTY, res.userId);  
            } else {
                alert("Failed to join game. Contact vingkan@gmail.com for help.");
                console.error(res); 
            }
        }).catch((err) => {
            alert("Failed to join game. Contact vingkan@gmail.com for help.");
            console.error(err);
        });
    } else {
        const userId = localStorage.getItem(USER_PROPERTY);
        fetch(`${API_ROOT}/api/game/join/${gameId}?new=false&user=${userId}`).then((res) => {
            if (!res.success) {
                alert("Failed to join game. Contact vingkan@gmail.com for help.");
                console.error(res); 
            }
        }).catch((err) => {
            alert("Failed to join game. Contact vingkan@gmail.com for help.");
            console.error(err);
        });
    }
    leaveBtn.addEventListener("click", (e) => {
        const userId = localStorage.getItem(USER_PROPERTY);
        if (!userId) {
            console.log("No user ID, cannot leave game.");
            return;
        }
        fetch(`${API_ROOT}/api/game/leave/${gameId}?user=${userId}`).then((res) => {
            if (res.success) {
                localStorage.removeItem(GAME_PROPERTY);
                localStorage.removeItem(USER_PROPERTY);
                window.location = SITE_ROOT;
            } else {
                alert("Failed to leave game. Contact vingkan@gmail.com for help.");
                console.error(res);
            }
        }).catch((err) => {
            alert("Failed to leave game. Contact vingkan@gmail.com for help.");
            console.error(err);
        });
    });
    startBtn.addEventListener("click", (e) => {
        fetch(`${API_ROOT}/api/game/start/${gameId}`).then((res) => {
            if (res.success) {
                window.location = `${SITE_ROOT}/case`;  
            } else {
                alert("Failed to start game. Contact vingkan@gmail.com for help.");
                console.error(res);
            }
        }).catch((err) => {
            alert("Failed to start game. Contact vingkan@gmail.com for help.");
            console.error(err);
        });
    });
}

if (viewId === "home") {
    if (localStorage.hasOwnProperty(GAME_PROPERTY)) {
        doJoin();
    } else {
        const button = document.querySelector("#create-game .button");
        button.addEventListener("click", (e) => {
            fetch(`${API_ROOT}/api/game/create`).then((res) => {
                if (res.success) {
                    localStorage.setItem(GAME_PROPERTY, res.gameId);
                    window.location = `${SITE_ROOT}/join?game=${res.gameId}`;
                    // doJoin(); 
                } else {
                    alert("Failed to create game. Contact vingkan@gmail.com for help.");
                    console.error(res);
                }
            }).catch((err) => {
                alert("Failed to create game. Contact vingkan@gmail.com for help.");
                console.error(err);
            });
        });
    }
}

if (viewId === "join") {
    doJoin();
}

const limitMins = 59;
const limitSecs = 59;

const sidebarClues = [
    "risk",
    "movement",
    "attention",
    "vendor",
    "offer",
    "removal",
];

function updateGame() {
    const gameId = localStorage.getItem(GAME_PROPERTY);
    if (!gameId) {
        return;
    }
    const sidebar = document.querySelector(".sidebar");
    const timerEl = document.querySelector(".timer");
    const cluesEl = document.querySelector(".sidebar .clues");
    db.ref(`${FIREBASE_ROOT}/games/${gameId}`).on("value", (snap) => {
        const data = snap.val() || {};
        const unlockedMap = data.unlocked || {};
        if (sidebar) {
            const startedLocalTime = new Date(data.started).getTime();
            const updateTimer = () => {
                const nowLocalTime = Date.now();
                const elapsedMillisecs = new Date(nowLocalTime - startedLocalTime);
                const elapsedMins = elapsedMillisecs.getTime() / (60 * 1000);
                const minsUsed = Math.floor(elapsedMins);
                const secsUsed = Math.floor((elapsedMins - Math.floor(elapsedMins)) * 60);
                const timeRemaining = minsUsed <= limitMins;
                const minsLeft = `${timeRemaining ? limitMins - minsUsed : minsUsed - limitMins - 1}`;
                const secsLeft = `${timeRemaining ? limitSecs - secsUsed : secsUsed}`;
                if (minsUsed > 90) {
                    timerEl.innerText = "OVER";
                } else {
                    const sign = timeRemaining ? "" : "+";
                    timerEl.innerText = `${sign}${minsLeft.length == 1 ? "0" + minsLeft : minsLeft}:${secsLeft.length == 1 ? "0" + secsLeft : secsLeft}`;
                }
            };
            updateTimer();
            setInterval(() => {
                updateTimer();
            }, 1000);
            cluesEl.innerHTML = "";
            sidebarClues.forEach((clueId) => {
                const isUnlocked = clueId in unlockedMap;
                let clueEl = document.createElement("div");
                let iconEl = document.createElement("i");
                iconEl.classList.add("fa");
                iconEl.classList.add("fa-key");
                clueEl.appendChild(iconEl);
                let tagEl = document.createElement("span");
                tagEl.innerText = clueId;
                clueEl.appendChild(tagEl);
                clueEl.classList.add("clue");
                if (isUnlocked) {
                    clueEl.classList.add("unlocked");
                }
                cluesEl.append(clueEl);
            });
        }
        if ("risk" in unlockedMap && "movement" in unlockedMap && "attention" in unlockedMap) {
            const hiddenClueBanner = document.querySelector("#banner-removal");
            const hiddenClueEmail = document.querySelector("#email-removal");
            if (hiddenClueBanner && hiddenClueEmail) {
                hiddenClueBanner.classList.remove("hidden");
                hiddenClueEmail.classList.remove("hidden");
            }
        }
    });
}

window.scrollTo(0, 0);
updateGame();