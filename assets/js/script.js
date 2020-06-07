/*
 global window
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

function getAPIRoot(forceProduction = false) {
    const onLocal = window.location.origin.indexOf("localhost") > -1;
    if (forceProduction || !onLocal) {
        return "https://panopticonsecurity.herokuapp.com";
    } else {
        return "http://localhost:3000";
    }
}

function getSiteRoot() {
    if(window.location.origin.indexOf("localhost") > -1) {
        return window.location.origin;
    } else { 
        return `${window.location.origin}/panopticon`
    }
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

function getViewId(offset = 0) {
    if (window.location.origin.indexOf("ethicsescape.github.io") > -1) {
        if (window.location.pathname.split("/")[2 + offset]) {
            return window.location.pathname.split("/")[2 + offset];
        }
        return "home";
    }
    if (window.location.pathname.split("/")[1 + offset]) {
        return window.location.pathname.split("/")[1 + offset];
    }
    return "home";
}

function tryPassword(entered, expected, ms) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (entered.toLowerCase() === expected.toLowerCase()) {
                resolve({ success: true, message: `Access granted.` });
            } else {
                resolve({ success: false, message: `Wrong password.` });
            }
        }, ms);
    });
}

function invertMap(map) {
    return Object.keys(map).reduce((inverted, key) => {
        inverted[map[key]] = key;
        return inverted;
    }, {});
}

function hideEl(el) {
    if (!el.classList.contains("hidden")) {
        el.classList.add("hidden");
    }
}

function showEl(el) {
    if (el.classList.contains("hidden")) {
        el.classList.remove("hidden");
    }
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

const PROD_PROPERTY = "panopticon_force_prod";
const GAME_PROPERTY = "panopticon_game_id";
const USER_PROPERTY = "panopticon_user_id";
const VIEWED_MISSION_PROPERTY = "panopticon_viewed_mission";
const FIREBASE_ROOT = "panopticon";
const FORCE_PROD = localStorage.hasOwnProperty(PROD_PROPERTY);
const API_ROOT = getAPIRoot(FORCE_PROD);
const SITE_ROOT = getSiteRoot();

const validSuspects = {
    "Shopper #1263": true,
    "Shopper #6871": true,
    "Shopper #6362": true,
    "Shopper #1943": true,
    "Shopper #2193": true
};

const MISSIONS = [
    {
        id: "gavel",
        name: "Gavel",
        goal: "Whenever a player suggests a suspect, ask them (1) what their justification is and (2) whether or not that is a good justification.",
        suggest: "A good mission for someone talkative.",
        icon: "gavel",
        recap: "evaluate players' justifications"
    },
    {
        id: "power",
        name: "Power",
        goal: "Persuade another player to shut down the surveillance system, but you cannot be the one to shut it down.",
        suggest: "A good mission for someone daring.",
        icon: "plug",
        recap: "convince someone to shut down the system"
    },
    {
        id: "eye",
        name: "Eye",
        goal: "Identify something the store does that makes life harder for Black people and suggest a way to improve it in your team’s recommendations to the store.",
        suggest: "A good mission for someone empathetic.",
        icon: "eye",
        recap: "identify something that harms Black people"
    },
    {
        id: "paperclip",
        name: "Paperclip",
        goal: "When you find Form 14-3-98, get your team to discuss the comments and ask what they would do if a suspect submitted this form.",
        suggest: "A good mission for someone focused.",
        icon: "paperclip",
        recap: "discuss consent and data removal"
    },
];
const missionMap = MISSIONS.reduce((agg, val) => {
    agg[val.id] = val;
    return agg;
}, {});

const limitMins = 59;
const limitSecs = 59;

const sidebarClues = [
    "risk",
    "movement",
    "attention",
    "pledge",
    "offer",
    "removal",
    "lookup",
];

function setNewGameID(newGameId) {
    if (localStorage.hasOwnProperty(GAME_PROPERTY)) {
        const oldGameId = localStorage.getItem(GAME_PROPERTY);
        if (oldGameId !== newGameId) {
            localStorage.removeItem(VIEWED_MISSION_PROPERTY);
            sidebarClues.forEach((clueId) => {
                localStorage.removeItem(`panopticon_clue_${clueId}`);
            });
            localStorage.setItem(GAME_PROPERTY, newGameId);
        }
    } else {
        localStorage.setItem(GAME_PROPERTY, newGameId);
    }
}

// Wake up game server
fetch(API_ROOT);

const viewId = getViewId();
const tabId = getViewId(offset=1);
console.log(viewId);
console.log(tabId);
const tabEl = document.querySelector(`[data-tab='${tabId}']`);
if (tabEl) {
    tabEl.classList.add("selected");  
}

const remMisEl = document.querySelector("#mission-reminder");
if (!localStorage.hasOwnProperty(VIEWED_MISSION_PROPERTY) && remMisEl) {
    showEl(remMisEl);
}

if (viewId === "secure") {
    const clueId = document.querySelector("#clue-id").innerText;
    const input = document.querySelector("[data-view=secure] input");
    const button = document.querySelector("[data-view=secure] button");
    const messageEl = document.querySelector("[data-view=secure] .message");
    input.focus();
    if (localStorage.hasOwnProperty(`panopticon_clue_${clueId}`)) {
        const storedCode = localStorage.getItem(`panopticon_clue_${clueId}`);
        input.value = storedCode;
        showMessage(messageEl, true, "Clue already unlocked.");
    }
    let attempts = 0;
    const accessDocument = () => {
        const accessCode = input.value.toLowerCase();
        const elephant = atob(document.querySelector("#elephant").innerText).toLowerCase();
        const viper = decodeURI(atob(document.querySelector("#viper").innerText));
        const gameId = localStorage.getItem(GAME_PROPERTY);
        const userId = localStorage.getItem(USER_PROPERTY);
        attempts++;
        if (accessCode === elephant) {
            fetch(`${API_ROOT}/api/unlock/${clueId}?code=${accessCode}&game=${gameId}&user=${userId}`);
            if (messageEl.classList.contains("failure")) {
                messageEl.classList.remove("failure");
            }
            messageEl.classList.add("success");
            const isExternalLink = viper.indexOf("http") === 0;
            const linkEl = document.createElement("a");
            linkEl.href = viper;
            if (isExternalLink) {
                linkEl.target = "_blank";
            }
            linkEl.innerText = "Access granted. Click here.";
            messageEl.innerText = "";
            messageEl.appendChild(linkEl);
        } else {
            messageEl.classList.add("failure");
            messageEl.innerText = `Incorrect password (attempted ${attempts} time${attempts === 1 ? "" : "s"}).`;
        }
    }
    button.addEventListener("click", accessDocument);
    input.addEventListener("keypress", (e) => {
        if (e.keyCode === 13) {
            accessDocument();
        }
    });
}

if (tabId === "activate") {
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

if (tabId === "decision") {
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
                const endLink = document.querySelector("#end-link");
                showEl(endLink);
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

function leftpad(d) {
    const s = `${d}`;
    if (s.length < 2) {
        return `0${d}`;
    }
    return s;
}

function renderPoints(polyLineEl, points)  {
    const s = polyLineEl.parentElement.clientWidth;
    const pointData = points.map(({ x, y }) => `${x * s},${y * s}`).join(" ");
    polyLineEl.setAttribute("points", pointData);
}

function renderPerson(polyLineEl, circleEl, step)  {
    const s = polyLineEl.parentElement.clientWidth;
    circleEl.setAttribute("cx", step.x * s);
    circleEl.setAttribute("cy", step.y * s);
    circleEl.setAttribute("r", 5);
}

function renderClock(clockEl, elapsedMs, settings = {})  {
    const startHours = settings.startHours || 0;
    const startMins = settings.startMins || 0;
    const startSecs = settings.startSecs || 0;
    const timeFactor = settings.timeFactor || 1;
    const startHoursSecs = startHours * 60 * 60 || 0;
    const startMinsSecs = startMins * 60 || 0;
    const elapsedSecs = timeFactor * (elapsedMs / 1000);
    const totalSecs = startHoursSecs + startMinsSecs + startSecs + elapsedSecs;
    const hours = Math.floor(totalSecs / (60 * 60));
    const mins = Math.floor((totalSecs % (60 * 60)) / (60));
    const secs = Math.floor(totalSecs % 60);
    const time = `${leftpad(hours)}:${leftpad(mins)}:${leftpad(secs)} PM`;
    clockEl.innerText = time;
}

let replayInterval;

function makeReplay(replayEl, personEl, clockEl, replay, settings) {
    return () => {
        clearInterval(replayInterval);
        let seen = [];
        let stepTime = Date.now();
        let i = 0;
        const startMs = Date.now();
        let isReady = true;
        replayInterval = setInterval(() => {
            const elapsed = Date.now() - startMs;
            renderClock(clockEl, elapsed, settings);
            if (isReady) {
                const step = replay[i];
                seen.push(step);
                renderPoints(replayEl, seen);
                renderPerson(replayEl, personEl, step);
                stepTime = Date.now();
                i++;
                if (i >= replay.length) {
                    clearInterval(replayInterval);
                }
                isReady = false;
            } else if (Date.now() - stepTime > replay[i].t) {
                isReady = true;
            }
        }, 10);
    }
}

function showMovementData(monitorEl, data) {
    const timeFactor = 15;
    const replayEl = monitorEl.querySelector("polyline");
    const personEl = monitorEl.querySelector("circle");
    const clockEl = monitorEl.querySelector(".clock");
    const play = makeReplay(replayEl, personEl, clockEl, data.points, {
        startHours: data.startHours,
        startMins: data.startMins,
        startSecs: data.startSecs,
        timeFactor
    });
    monitorEl.parentElement.classList.remove("hidden");
    const btn = document.querySelector("[data-view=replay] #play-btn");
    btn.classList.remove("hidden");
    btn.addEventListener("click", (e) => {
        btn.innerText = "Restart";
        play();
    });
}

if (viewId === "replay") {
    const monitorSize = 500;
    const monitorEl = document.querySelector("[data-view=replay] .monitor");
    monitorEl.style.width = `${monitorSize}px`;
    monitorEl.style.height = `${monitorSize}px`;
    const replayEl = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    monitorEl.querySelector("svg").appendChild(replayEl);
    const personEl = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    monitorEl.querySelector("svg").appendChild(personEl);
    const clockEl = monitorEl.querySelector(".clock");
    const select = document.querySelector("[data-view=replay] select");
    const btn = document.querySelector("[data-view=replay] #load-btn");
    const moveMsgEl = document.querySelector("[data-view=replay] .message");

    clearInterval(replayInterval);
    document.querySelector("[data-view=replay] #play-btn").innerText = "Play";
    replayEl.setAttribute("points" , "");
    personEl.setAttribute("r" , 0);
    clockEl.innerText = "";
    const suspectId = document.querySelector("#ox").innerText;
    console.log(suspectId);
    const rawReplayData = document.querySelector("#leopard").innerText;
    const replayData = JSON.parse(rawReplayData);
    showMessage(moveMsgEl, true, `Successfully loaded movement data for Shopper #${suspectId}.`);
    showMovementData(monitorEl, replayData);
}

if (tabId === "lookup" && viewId === "case") {
    const inputEl = document.querySelector("[data-view=lookup] input");
    const btnEl = document.querySelector("[data-view=lookup] button");
    const msgEl = document.querySelector("[data-view=lookup] .message");
    const handleSubmit = () => {
        const email = inputEl.value;
        if (!email || email.indexOf("@") < 0) {
            showMessage(msgEl, false, "Please enter a valid email address.");
            return;
        }
        fetch(`${API_ROOT}/api/lookup?email=${email}`).then((res) => {
            if (res.success) {
                showMessage(msgEl, true, res.message);
            } else {
                showMessage(msgEl, false, res.message);
            }
        }).catch((err) => {
            console.error(err);
            showMessage(msgEl, false, "Lookup failed.");
        });
    };
    btnEl.addEventListener("click", handleSubmit);
    inputEl.addEventListener("keypress", (e) => {
        if (e.keyCode === 13) {
            handleSubmit();
        }
    });
}

function doIntro() {
    sendHomeIfNotInGame();
    const gameId = localStorage.getItem(GAME_PROPERTY);
    const userId = localStorage.getItem(USER_PROPERTY);
    // Screen Name
    const screenNameInputEl = document.querySelector("#screen-name");
    const screenNameBtnEl = document.querySelector("#update-name");
    const nameMsgEl = document.querySelector("#name-message");
    const setScreenName = () => {
        const name = screenNameInputEl.value;
        fetch(`${API_ROOT}/api/name/${gameId}?user=${userId}&name=${encodeURI(name)}`).then((res) => {
            if (res.success) {
                screenNameInputEl.value = res.name;
                showMessage(nameMsgEl, true, "Successfully updated screen name!");
            } else {
                showMessage(nameMsgEl, false, res.message || "Failed to update screen name,");
            }
        }).catch((err) => {
            showMessage(nameMsgEl, false, "Failed to update screen name.");
        });
    };
    screenNameBtnEl.addEventListener("click", setScreenName);
    screenNameInputEl.addEventListener("keypress", (e) => {
        if (e.keyCode === 13) {
            setScreenName();
        }
    });
    // Mission Select
    const missionFormEl = document.querySelector(".mission-select");
    const missionMsgEl = document.querySelector("#mission-message");
    MISSIONS.forEach((mission) => {
        const html = `
            <button class="button mission-accept" data-mission="${mission.id}">Accept</button>
            <div class="mission-preview">
                <h3>
                    <i class="fa fa-${mission.icon}"></i>
                    <span>${mission.name}</span>
                    <span class="players message success" data-mission-player="${mission.id}"></span>
                </h3>
                <p>${mission.suggest}</p>
            </div>
        `;
        const div = document.createElement("div");
        div.classList.add("mission-row");
        div.innerHTML = html;
        missionFormEl.appendChild(div);
    });
    MISSIONS.forEach((mission) => {
        const btn = document.querySelector(`[data-mission=${mission.id}]`);
        btn.addEventListener("click", (e) => {
            fetch(`${API_ROOT}/api/mission/toggle/${gameId}?user=${userId}&mission=${mission.id}`).then((res) => {
                if (res.success) {
                    showMessage(missionMsgEl, true, "Successfully updated your mission!");
                } else {
                    showMessage(missionMsgEl, false, res.message || "Failed to accept mission.");
                }
            }).catch((err) => {
                showMessage(missionMsgEl, false, "Failed to accept mission.");
            });
        });
    });
    // Play Game
    const startBtn = document.querySelector("#start-game");
    startBtn.addEventListener("click", (e) => {
        fetch(`${API_ROOT}/api/game/start/${gameId}`).then((res) => {
            if (res.success) {
                window.location = `${SITE_ROOT}/case/info`;  
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

function doDiscussion() {
    sendHomeIfNotInGame();
    const gameId = localStorage.getItem(GAME_PROPERTY);
    const userId = localStorage.getItem(USER_PROPERTY);
}

function doJoin() {
    if (window.location.href.indexOf("?join=") > -1) {
        const linkGameId = window.location.href.split("?join=")[1].split("&")[0];
        setNewGameID(linkGameId);
    }
    const gameId = localStorage.getItem(GAME_PROPERTY);
    if (!gameId) {
        console.log("Invalid game ID.");
        return;
    }
    document.querySelector("[data-view=join]").classList.remove("hidden");
    document.querySelector("#create-game").classList.add("hidden");
    const linkStatEl = document.querySelector("#link-status");
    const gameLinkEl = document.querySelector("#game-link");
    const joinLink = `${SITE_ROOT}?join=${gameId}`;
    gameLinkEl.innerText = joinLink;
    gameLinkEl.setAttribute("data-clipboard-text", joinLink);
    const clip = new ClipboardJS(gameLinkEl);
    clip.on("success", (e) => {
        showMessage(linkStatEl, true, "Copied join URL to clipboard!");
        setTimeout(() => {
            linkStatEl.innerText = "";
        }, 3000);
        e.clearSelection();
    });
    clip.on("error", (e) => {
        showMessage(linkStatEl, false, "Failed to copy URL automatically.");
        setTimeout(() => {
            linkStatEl.innerText = "";
        }, 3000);
    });
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
                localStorage.removeItem(VIEWED_MISSION_PROPERTY);
                sidebarClues.forEach((clueId) => {
                    localStorage.removeItem(`panopticon_clue_${clueId}`);
                });
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
}

if (viewId === "home") {
    if (localStorage.hasOwnProperty(GAME_PROPERTY) || window.location.href.indexOf("?join=") > -1) {
        doJoin();
    } else {
        const button = document.querySelector("#create-game .button");
        button.addEventListener("click", (e) => {
            fetch(`${API_ROOT}/api/game/create`).then((res) => {
                if (res.success) {
                    setNewGameID(res.gameId);
                    window.location = `${SITE_ROOT}?join=${res.gameId}`;
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

if (viewId === "intro") {
    doIntro();
}

if (viewId === "discussion") {
    doDiscussion();
}

function updateGame() {
    const gameId = localStorage.getItem(GAME_PROPERTY);
    const userId = localStorage.getItem(USER_PROPERTY);
    if (!gameId || ! userId) {
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
                    localStorage.setItem(`panopticon_clue_${clueId}`, unlockedMap[clueId]);
                    clueEl.classList.add("unlocked");
                    clueEl.addEventListener("click", (e) => {
                        window.location = `${SITE_ROOT}/secure/${clueId}`;
                    });
                }
                cluesEl.append(clueEl);
            });
        }
        const hasPreReqs = "risk" in unlockedMap && "movement" in unlockedMap && "attention" in unlockedMap;
        const isOpened = "removal" in unlockedMap;
        if (hasPreReqs) {
            const hiddenClueEmail = document.querySelector("#email-removal");
            if (hiddenClueEmail) {
                hiddenClueEmail.classList.remove("hidden");
            }
            if (!isOpened) {
                const hiddenClueBanner = document.querySelector("#banner-removal");
                if (hiddenClueBanner) {
                    hiddenClueBanner.classList.remove("hidden");
                }
            }
        }
        const nameMap = data.names || {};
        const gameMissionMap = data.missions || {};
        // Mission Icon
        const coverEl = document.querySelector(".cover");
        const missionIconEl = document.querySelector(".mission");
        const hasMissionicon = missionIconEl && missionIconEl.classList.contains("hidden");
        const hasMissionData = userId in gameMissionMap && gameMissionMap[userId] in missionMap;
        if (hasMissionicon && hasMissionData) {
            const missionId = gameMissionMap[userId];
            const missionData = missionMap[missionId];
            missionIconEl.querySelector("i").classList.add(`fa-${missionData.icon}`);
            missionIconEl.classList.remove("hidden");
            missionIconEl.addEventListener("click", (e) => {
                if (coverEl) {
                    hideEl(remMisEl);
                    showEl(coverEl);
                    localStorage.setItem(VIEWED_MISSION_PROPERTY, true);
                }
            });
        }
        const popupEl = document.querySelector(".popup");
        const closeEl = document.querySelector(".popup .close");
        if (coverEl && popupEl && popupEl.getAttribute("data-state") === "empty" && hasMissionData) {
            const missionId = gameMissionMap[userId];
            const missionData = missionMap[missionId];
            popupEl.querySelector("[data-role=icon]").classList.add(`fa-${missionData.icon}`);
            popupEl.querySelector("[data-role=name]").innerText = missionData.name;
            popupEl.querySelector("[data-role=goal]").innerText = missionData.goal;
            popupEl.setAttribute("data-state", "filled");
            coverEl.addEventListener("click", (e) => {
                if (e.target == coverEl || e.target == closeEl) {
                    hideEl(coverEl);
                }
            });
        }
        // Intro Page
        const introEl = document.querySelector("[data-view=intro]");
        const goToCaseLink = document.querySelector("#go-to-case");
        if (goToCaseLink && data.started) {
            showEl(goToCaseLink);
        }
        if (introEl) {
            const screenNameInputEl = document.querySelector("#screen-name");
            if (screenNameInputEl && userId in data.names && !screenNameInputEl.value) {
                screenNameInputEl.value = data.names[userId];
            }
            Object.keys((missionMap)).forEach((missionId) => {
                const btnEl = document.querySelector(`[data-mission=${missionId}]`);
                const spanEl = document.querySelector(`[data-mission-player=${missionId}]`);
                if (btnEl && spanEl) {
                    spanEl.innerText = "";
                    if (btnEl.classList.contains("accepted")) {
                        btnEl.classList.remove("accepted");
                    }
                    if (btnEl.classList.contains("locked")) {
                        btnEl.classList.remove("locked");
                    }
                    btnEl.innerText = "Accept";
                }
            });
            Object.keys((gameMissionMap)).forEach((missionUserId) => {
                const missionId = gameMissionMap[missionUserId];
                const btnEl = document.querySelector(`[data-mission=${missionId}]`);
                const spanEl = document.querySelector(`[data-mission-player=${missionId}]`);
                if (btnEl && spanEl) {
                    spanEl.innerText = `(${nameMap[missionUserId]})`;
                    if (missionUserId == userId) {
                        btnEl.classList.add("accepted");
                        btnEl.innerText = "Drop";
                    } else {
                        btnEl.classList.add("locked");
                        btnEl.innerText = "Taken";
                    }
                }
            });
        }
        // Discussion
        let finalSubmission = false;
        if (data.hasOwnProperty("decisions")) {
            const endLink = document.querySelector("#end-link");
            if (endLink) {
                showEl(endLink);
            }
            const submissions = Object.keys(data.decisions).map((key) => {
                return data.decisions[key];
            }).sort((a, b) => {
                return b.timestamp - a.timestamp;
            });
            finalSubmission = submissions[0];
            const suspectId = finalSubmission.suspect.split("#")[1];
            const suspectTag = document.querySelector(`[data-shopper="${suspectId}"]`);
            if (suspectTag && suspectTag.innerText.indexOf("selected") < 0) {
                suspectTag.innerText = `${suspectTag.innerText} (the suspect you selected)`;
                suspectTag.classList.add("message");
                if (btoa(finalSubmission.suspect) === "U2hvcHBlciAjNjg3MQ==") {
                    suspectTag.classList.add("success");
                } else {
                    suspectTag.classList.add("failure");
                }
            }
        }
        const discussionEl = document.querySelector("[data-view=discussion]");
        if (discussionEl) {
            const discData = data.discussion || false;
            if (!discData) {
                showEl(discussionEl.querySelector("#discussion-entry"));
                hideEl(discussionEl.querySelector("#mission-box"));
                hideEl(discussionEl.querySelector("#conclusion"));
                const startBtn = document.querySelector("#start-discussion");
                if (startBtn.getAttribute("data-state") === "nohook") {
                    startBtn.addEventListener("click", (e) => {
                        fetch(`${API_ROOT}/api/discussion/next/${gameId}`);
                    });
                    startBtn.setAttribute("data-state", "listening");
                }
            } else if (discData.active === "end") {
                hideEl(discussionEl.querySelector("#discussion-entry"));
                hideEl(discussionEl.querySelector("#mission-box"));
                showEl(discussionEl.querySelector("#conclusion"));
                const concEl = discussionEl.querySelector("#conclusion");
                if (finalSubmission && concEl.getAttribute("data-state") === "empty") {
                    concEl.setAttribute("data-state", "filled");
                    const ms = finalSubmission.timestamp - data.started;
                    const totalSecs = Math.floor(ms / 1000);
                    const mins = Math.floor((totalSecs / 60));
                    const secs = totalSecs % 60;
                    const resTimeEl = document.querySelector("#results-time");
                    const resSusEl = document.querySelector("#results-suspect");
                    resTimeEl.innerText = `${mins} min${mins === 1 ? "" : "s"}, ${secs} sec${secs === 1 ? "" : "s"}`;
                    resSusEl.innerText = finalSubmission.suspect;
                    document.querySelector("#results-rationale").innerText = finalSubmission.rationale;
                    document.querySelector("#results-recommendations").innerText = finalSubmission.recommendations;
                    if (mins <= 59) {
                        resTimeEl.classList.add("success");
                    } else {
                        resTimeEl.classList.add("failure");
                    }
                    if (btoa(finalSubmission.suspect) === "U2hvcHBlciAjNjg3MQ==") {
                        resSusEl.classList.add("success");
                    } else {
                        resSusEl.classList.add("failure");
                    }
                    const sysMap = finalSubmission.systems || {};
                    const systemIds = ["risk", "movement", "attention"];
                    systemIds.forEach((sid) => {
                        const sysEl = concEl.querySelector(`[data-system=${sid}] .status`);
                        const wasActive = !(sid in sysMap) || sysMap[sid];
                        if (wasActive) {
                            sysEl.classList.add("success");
                            sysEl.innerText = `ACTIVE`;
                        } else {
                            sysEl.classList.add("failure");
                            sysEl.innerText = `DEACTIVATED`;
                        }
                    });
                    const resCluEl = document.querySelector("#results-clues");
                    if (resCluEl.getAttribute("data-state") === "empty") {
                        const unlockedByMap = data.unlockedby || {};
                        let clueCount = 0;
                        resCluEl.setAttribute("data-state", "filled");
                        sidebarClues.forEach((clueId) => {
                            const clueResHtml = `
                                <div class="clue">
                                    <i class="fa fa-key"></i>
                                </div>
                                <div class="clue-status">
                                    <strong>${clueId}</strong>
                                    <span></span>
                                </div>
                            `;
                            const div = document.createElement("div");
                            div.classList.add("row-half");
                            div.innerHTML = clueResHtml;
                            const sc = div.querySelector("span");
                            const ci = div.querySelector(".clue");
                            if (clueId in unlockedByMap) {
                                clueCount++;
                                ci.classList.add("unlocked");
                                sc.innerText = ` unlocked by ${nameMap[unlockedByMap[clueId]]}`;
                            } else {
                                sc.innerText = ` not unlocked`;
                            }
                            resCluEl.appendChild(div);
                        });
                        const clueCountEl = document.querySelector("#clue-count");
                        clueCountEl.innerText = `${clueCount}/${sidebarClues.length}`;
                        if (clueCount === sidebarClues.length) {
                            clueCountEl.classList.add("success");
                        } else {
                            clueCountEl.classList.add("failure");
                        }
                    }
                    const popularMap = {};
                    const voteMap = discData.votes || {};
                    Object.keys(voteMap).forEach((missionId) => {
                        Object.keys(voteMap[missionId]).forEach((otherUserId) => {
                            const votedForId = voteMap[missionId][otherUserId];
                            if (!(votedForId in popularMap)) {
                                popularMap[votedForId] = {};
                            }
                            if (!(missionId in popularMap[votedForId])) {
                                popularMap[votedForId][missionId] = 0;
                            }
                            popularMap[votedForId][missionId]++;
                        });
                    });
                    const resMisEl = document.querySelector("#results-missions");
                    Object.keys(gameMissionMap).forEach((doerId) => {
                        const div = document.createElement("div");
                        div.classList.add("row-half");
                        const p = document.createElement("p");
                        const s1 = document.createElement("strong");
                        s1.innerText = nameMap[doerId];
                        const s2 = document.createElement("span");
                        s2.innerText= ` tried to ${missionMap[gameMissionMap[doerId]].recap}`;
                        p.appendChild(s1);
                        p.appendChild(s2);
                        div.appendChild(p);
                        const ul = document.createElement("ul");
                        if (doerId in popularMap) {
                            Object.keys(popularMap[doerId]).forEach((mid) => {
                                const li = document.createElement("li");
                                const x = popularMap[doerId][mid];
                                li.innerText = `${x} player${x === 1 ? "" : "s"} thought they were trying to ${missionMap[mid].recap}`;
                                if (mid === gameMissionMap[doerId]) {
                                    li.classList.add("message");
                                    li.classList.add("success");
                                }
                                ul.appendChild(li);
                            });
                        } else {
                            const li = document.createElement("li");
                            li.innerText = "But no one realized it was them";
                            ul.appendChild(li);
                        }
                        div.appendChild(ul);
                        resMisEl.appendChild(div);
                    });
                }
            } else if (discData.active) {
                hideEl(discussionEl.querySelector("#discussion-entry"));
                showEl(discussionEl.querySelector("#mission-box"));
                hideEl(discussionEl.querySelector("#conclusion"));
                const revealBtn = document.querySelector("#reveal-btn");
                if (revealBtn.getAttribute("data-state") === "nohook") {
                    revealBtn.addEventListener("click", (e) => {
                        // const confirm = prompt("Has everyone voted? Type 'yes' to reveal.");
                        // if (confirm.toLowerCase().indexOf("yes") > -1) {
                            fetch(`${API_ROOT}/api/discussion/reveal/${gameId}`);
                        // }
                    });
                    revealBtn.setAttribute("data-state", "listening");
                }
                const nextBtn = document.querySelector("#next-btn");
                if (nextBtn.getAttribute("data-state") === "nohook") {
                    nextBtn.addEventListener("click", (e) => {
                        // const confirm = prompt("Had a good discussion? Type 'yes' to move on.");
                        // if (confirm.toLowerCase().indexOf("yes") > -1) {
                            fetch(`${API_ROOT}/api/discussion/next/${gameId}`);
                        // }
                    });
                    nextBtn.setAttribute("data-state", "listening");
                }
                const activeMission = discData.active;
                console.log(activeMission);
                const missionRevealEl = document.querySelector("#mission-reveal");
                const invertedGameMissionMap = invertMap(gameMissionMap);
                const holderUserId = invertedGameMissionMap[activeMission];
                const voteMap = discData.votes || {};
                const missionVotes = voteMap[activeMission] || {};
                if (holderUserId) {
                    const c = Object.keys(missionVotes).reduce((agg, key) => {
                        return agg + (missionVotes[key] === holderUserId ? 1 : 0);
                    }, 0);
                    missionRevealEl.querySelector("#name-span").innerText = nameMap[holderUserId];
                    missionRevealEl.querySelector("#total-span").innerText = `(${c} player${c === 1 ? "" : "s"} correctly guessed it was them)`;
                } else {
                    missionRevealEl.querySelector("#name-span").innerText = "no one";
                    missionRevealEl.querySelector("#total-span").innerText = "";
                }
                const spanHTML = `
                    <i class="fa fa-${missionMap[activeMission].icon}"></i> ${missionMap[activeMission].name}
                `.trim();
                missionRevealEl.querySelector("#mission-span").innerHTML = spanHTML;
                const missionTextEl = document.querySelector("#mission-text");
                missionTextEl.innerText = missionMap[activeMission].goal;
                const tickerEl = document.querySelector("#ticker");
                if (discData.mode === "vote") {
                    tickerEl.innerText = "Who do you think had this mission?";
                    showEl(revealBtn);
                    hideEl(missionRevealEl);
                    hideEl(nextBtn);
                } else if (discData.mode === "discuss") {
                    if (holderUserId) {
                        tickerEl.innerText = "How did this mission go?";    
                    } else {
                        tickerEl.innerText = "Did you achieve this mission anyway?";
                    }
                    showEl(nextBtn);
                    showEl(missionRevealEl);
                    hideEl(revealBtn);
                }
                const voteBtnsEl = discussionEl.querySelector(".vote-buttons");
                if (voteBtnsEl.getAttribute("data-state") === "empty") {
                    Object.keys((gameMissionMap)).forEach((missionUserId) => {
                        const btn = document.createElement("button");
                        btn.classList.add("button");
                        btn.setAttribute("data-user", missionUserId);
                        btn.innerText = nameMap[missionUserId];
                        btn.addEventListener("click", (e) => {
                            const voteUserId = e.target.getAttribute("data-user");
                            fetch(`${API_ROOT}/api/discussion/vote/${gameId}?user=${userId}&vote=${voteUserId}`);
                        });
                        voteBtnsEl.appendChild(btn);
                    });
                    voteBtnsEl.setAttribute("data-state", "filled");
                }
                const voteCounterEl = document.querySelector("#vote-status");
                const n = Object.keys(missionVotes).length;
                if (n > 0) {
                    voteCounterEl.innerText = `${n} player${n === 1 ? "" : "s"} voted`;
                } else {
                    voteCounterEl.innerText = "";
                }
                const voteResultEl = document.querySelector("#vote-result");
                voteResultEl.innerText = "";
                if (missionVotes.hasOwnProperty(userId)) {
                    hideEl(voteBtnsEl);
                    voteResultEl.innerText = `Voted for ${nameMap[missionVotes[userId]]}`;
                } else {
                    showEl(voteBtnsEl);
                }
            }
        }
    });
}

function sendHomeIfNotInGame() {
    const hasGameId = localStorage.hasOwnProperty(GAME_PROPERTY);
    const hasUserId = localStorage.hasOwnProperty(USER_PROPERTY);
    if ((!hasGameId || !hasUserId) && viewId !== "home") {
        window.location =`${SITE_ROOT}`;
    }
}

window.scrollTo(0, 0);
updateGame();
