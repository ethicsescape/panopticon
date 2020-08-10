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

function getCurrentPage() {
    const siteRoot = getSiteRoot();
    const fullLink = window.location.href;
    const link = fullLink.split(siteRoot)[1];
    const title = document.title;
    return { title, link };
}

function cleanPassword(raw) {
    return raw.toLowerCase().trim();
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
const FLAG_VIEWED_MISSION = "panopticon_flag_viewed_mission";
const FLAG_GAME_NOT_STARTED = "panopticon_flag_game_not_started";
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
        goal: "After unlocking the offer email and opening the activation link, persuade another player to deactivate the surveillance system, but you cannot be the one to press the buttons.",
        suggest: "A good mission for someone daring.",
        icon: "plug",
        recap: "convince someone to shut down the system"
    },
    {
        id: "eye",
        name: "Eye",
        goal: "Identify something the store does that makes life harder for Black people and suggest a way to improve it. When your team submits the decision form, get the writer to include your suggestion in your team’s recommendations to the store.",
        suggest: "A good mission for someone empathetic.",
        icon: "eye",
        recap: "identify something that harms Black people"
    },
    {
        id: "paperclip",
        name: "Paperclip",
        goal: "When you find the policy review file (Form 14-3-98), get your team to discuss the comments and ask what they would do if a suspect submitted this form.",
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
    "training",
    "offer",
    "removal",
    "lookup",
];

const RESOLUTION_CLUE = "resolution";

const ignoreClues = {
    "resolution": true,
};

function clearLocalGameData() {
    sidebarClues.forEach((clueId) => {
        localStorage.removeItem(`panopticon_clue_${clueId}`);
    });
    Object.keys(localStorage).forEach((key) => {
        const isFace = key.indexOf("panopticon_face_") === 0;
        const isDecision = key.indexOf("panopticon_decision_") === 0;
        const isPlayer = key.indexOf("panopticon_player_") === 0;
        const isFlag = key.indexOf("panopticon_flag_") === 0;
        if (isFace || isDecision || isPlayer || isFlag) {
            localStorage.removeItem(key);
        }
    });
}

function setNewGameID(newGameId) {
    if (localStorage.hasOwnProperty(GAME_PROPERTY)) {
        const oldGameId = localStorage.getItem(GAME_PROPERTY);
        if (oldGameId !== newGameId) {
            clearLocalGameData();
            localStorage.setItem(GAME_PROPERTY, newGameId);
        }
    } else {
        localStorage.setItem(GAME_PROPERTY, newGameId);
    }
}

function updateCurrentPage() {
    const gameId = localStorage.getItem(GAME_PROPERTY);
    const userId = localStorage.getItem(USER_PROPERTY);
    if (!gameId || !userId) {
        return;
    }
    const { title, link } = getCurrentPage();
    const reqUrl = `${API_ROOT}/api/current?game=${encodeURIComponent(gameId)}&user=${encodeURIComponent(userId)}&title=${encodeURIComponent(title)}&link=${encodeURIComponent(link)}`;
    fetch(reqUrl);
}

// Wake up game server
fetch(API_ROOT);
updateCurrentPage();

const viewId = getViewId();
const tabId = getViewId(offset=1);
console.log(viewId);
console.log(tabId);
const tabEl = document.querySelector(`[data-tab='${tabId}']`);
if (tabEl) {
    tabEl.classList.add("selected");  
}

const remMisEl = document.querySelector("#mission-reminder");
if (!localStorage.hasOwnProperty(FLAG_VIEWED_MISSION) && remMisEl) {
    showEl(remMisEl);
}

if (viewId === "secure") {
    const clueId = document.querySelector("#clue-id").innerText;
    const input = document.querySelector("[data-view=secure] input");
    const button = document.querySelector("[data-view=secure] button");
    const messageEl = document.querySelector("[data-view=secure] .message");
    const elephant = cleanPassword(atob(document.querySelector("#elephant").innerText));
    const viper = decodeURI(atob(document.querySelector("#viper").innerText));
    const incorrectMessages = [
        "Incorrect password.",
        "That is not correct.",
        "Please try again."
    ];
    let attempts = 0;

    const openDocument = () => {
        // Navigate automatically
        window.location = viper;
        // Fallback that should not be needed
        const linkEl = document.createElement("a");
        linkEl.href = viper;
        linkEl.innerText = "Access granted. Click here.";
        messageEl.innerText = "";
        messageEl.appendChild(linkEl);
    };

    const accessDocument = () => {
        const accessCode = cleanPassword(input.value);
        const gameId = localStorage.getItem(GAME_PROPERTY);
        const userId = localStorage.getItem(USER_PROPERTY);
        if (accessCode === elephant) {
            fetch(`${API_ROOT}/api/unlock/${clueId}?code=${accessCode}&game=${gameId}&user=${userId}`);
            if (messageEl.classList.contains("failure")) {
                messageEl.classList.remove("failure");
            }
            messageEl.classList.add("success");
            messageEl.innerText = `Access granted. Opening...`;
            setTimeout(() => {
                openDocument();
            }, 1000);
        } else {
            messageEl.classList.add("failure");
            messageEl.innerText = incorrectMessages[attempts % incorrectMessages.length];
        }
        attempts++;
    };
    
    input.focus();
    if (localStorage.hasOwnProperty(`panopticon_clue_${clueId}`)) {
        const storedCode = localStorage.getItem(`panopticon_clue_${clueId}`).toLowerCase();
        input.value = storedCode;
        if (storedCode === elephant) {
            showMessage(messageEl, true, "Clue already unlocked.");
            openDocument();   
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
    const deaMessageEl = document.querySelector("#deactivated-message");
    const gameId = localStorage.getItem(GAME_PROPERTY);
    if (gameId) {
        const systemIds = ["risk", "movement", "attention"];
        if (db) {
            db.ref(`${FIREBASE_ROOT}/games/${gameId}`).on("value", (snap) => {
                const data = snap.val() || {};
                let hasInactive = false;
                if (data.systems) {
                    for (let systemId in data.systems) {
                        renderSystem(systemId, data.systems[systemId]);
                        if (!data.systems[systemId]) {
                            hasInactive = true;
                        }
                    }
                }
                if (hasInactive) {
                    showEl(deaMessageEl);
                } else {
                    hideEl(deaMessageEl);
                }
            });
        }
        systemIds.forEach((systemId) => {
            const sectionEl = document.querySelector(`[data-system=${systemId}]`);
            const colorEl = sectionEl.querySelector(".message");
            const statusEl = sectionEl.querySelector(".status");
            const toggleEl = sectionEl.querySelector(".button");
            toggleEl.addEventListener("click", (e) => {
                const isActive = statusEl.innerText.toLowerCase() === "active";
                let entered;
                if (isActive) {
                    entered = prompt(`DANGER: Are you sure you want to deactivate the ${systemId} layer? Type "${systemId}" to confirm.`);
                }
                if (entered === systemId || !isActive) {
                    fetch(`${API_ROOT}/api/game/toggle/${gameId}?system=${systemId}`).then((res) => {
                        if (res.success) {
                            if (res.state) {
                            showMessage(sysMessageEl, true, `Success. The ${systemId} layer has been reactivated. The data backlog you missed while the system was deactivated will be ingested.`);
                            } else {
                            showMessage(sysMessageEl, true, `Operation confirmed. Deactivated ${systemId} layer.`);                                
                            }
                        } else {
                            showMessage(sysMessageEl, false, `Failed to update ${systemId}. Contact the game facilitator.`);
                        }
                    }).catch((err) => {
                        showMessage(sysMessageEl, false, `Failed to update ${systemId}. Contact the game facilitator.`);
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
    // Persist suspect
    if (localStorage.hasOwnProperty("panopticon_decision_suspect")) {
        select.value = localStorage.getItem("panopticon_decision_suspect");
    }
    select.addEventListener("change", (e) => {
        localStorage.setItem("panopticon_decision_suspect", select.value);
    });
    // Persist rationale
    if (localStorage.hasOwnProperty("panopticon_decision_rationale")) {
        textareaRat.value = localStorage.getItem("panopticon_decision_rationale");
    }
    textareaRat.addEventListener("change", (e) => {
        localStorage.setItem("panopticon_decision_rationale", textareaRat.value);
    });
    // Persist recommendations
    if (localStorage.hasOwnProperty("panopticon_decision_recommendations")) {
        textareaRec.value = localStorage.getItem("panopticon_decision_recommendations");
        if (secretFormEl.classList.contains("hidden")) {
            secretFormEl.classList.remove("hidden");
        }
    }
    textareaRec.addEventListener("change", (e) => {
        localStorage.setItem("panopticon_decision_recommendations", textareaRec.value);
    });
    const processDecision = () => {
        messageEl.innerText = "";
        const suspect = select.value;
        if (!(suspect in validSuspects)) {
            showMessage(messageEl, false, "Please select a valid suspect.");
            return;
        }
        const rationale = textareaRat.value;
        if (rationale.split(" ").length < 5) {
            showMessage(messageEl, false, "Please provide a more detailed rationale.");
            return;
        }
        if (secretFormEl.classList.contains("hidden")) {
            secretFormEl.classList.remove("hidden");
            return;
        }
        const recommendations = textareaRec.value;
        if (recommendations.split(" ").length < 5) {
            showMessage(messageEl, false, "Please provide more detailed recommendations.");
            return;
        }
        const gameId = localStorage.getItem(GAME_PROPERTY);
        const query = `suspect=${encodeURIComponent(suspect)}&rationale=${encodeURIComponent(rationale)}&recommendations=${encodeURIComponent(recommendations)}`;
        fetch(`${API_ROOT}/api/game/decide/${gameId}?${query}`).then((res) => {
            if (res.success) {
                showMessage(messageEl, true, "Successfully submitted!");
                const endLink = document.querySelector("#end-link");
                showEl(endLink);
            } else {
                showMessage(messageEl, false, "Failed to submit. Contact the game facilitator.");
            }
        }).catch((err) => {
            showMessage(messageEl, false, "Failed to submit. Contact the game facilitator.");
        });
    };
    button.addEventListener("click", processDecision);
}

if (tabId === "movement") {
    Array.from(document.querySelectorAll(".replay-toggle")).forEach((toggleEl) => {
        toggleEl.addEventListener("click", (e) => {
            if (toggleEl.classList.contains("closed")) {
                toggleEl.classList.remove("closed");
                toggleEl.classList.add("open");
            } else {
                toggleEl.classList.remove("open");
                toggleEl.classList.add("closed");
            }
        });
    });
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

if (tabId === "face-detection" && viewId === "case") {
    const codeSpan = document.querySelector("#training-code");
    const updateCodeSpan = () => {
        const accessCode = Array.from(document.querySelectorAll(".box-label")).map((el) => {
            if (el.classList.contains("is-face")) {
                return el.querySelector("[data-letter]").getAttribute("data-letter");
            } else {
                return "";
            }
        }).join("");
        codeSpan.innerText = accessCode ? accessCode : "---";
    };
    Array.from(document.querySelectorAll(".box-label")).forEach((box) => {
        const boxId = box.getAttribute("data-box");
        if (localStorage.hasOwnProperty(`panopticon_face_${boxId}`)) {
            const label = localStorage.getItem(`panopticon_face_${boxId}`);
            box.classList.add(label);
        }
        Array.from(box.querySelectorAll(".button")).forEach((btn) => {
            btn.addEventListener("click", (e) => {
                const label = btn.getAttribute("data-label");
                if (box.classList.contains("is-face")) {
                    box.classList.remove("is-face");
                }
                if (box.classList.contains("not-face")) {
                    box.classList.remove("not-face");
                }
                box.classList.add(label);
                localStorage.setItem(`panopticon_face_${boxId}`, label);
                updateCodeSpan();
            });
        });
    });
    updateCodeSpan();
}

if (tabId === "hints" && viewId === "case") {
    const gameId = localStorage.getItem(GAME_PROPERTY);
    Array.from(document.querySelectorAll("[data-clue]")).forEach((hintEl) => {
        const clueId = hintEl.getAttribute("data-clue");
        const btn = hintEl.querySelector(".button");
        const msgEl = document.querySelector("#hints-message");
        btn.addEventListener("click", (e) => {
            if (!btn.classList.contains("locked")) {
                const reqUrl = `${API_ROOT}/api/hint/${gameId}?clue=${encodeURIComponent(clueId)}`;
                fetch(reqUrl).then((res) => {
                    showMessage(msgEl, res.success, res.message);
                }).catch((err) => {
                    showMessage(msgEl, false, "Something went wrong. Please reload and try again.");
                });
            } else {
                showMessage(msgEl, false, "Your team has already used this hint.");
            }
        });
    });
}

function makeTableRowOf(tag, cells, statusMap = {}) {
    const tr = document.createElement("tr");
    cells.forEach((content, i) => {
        const td = document.createElement(tag);
        td.innerText = content;
        if (i in statusMap) {
            td.classList.add("message");
            td.classList.add(statusMap[i] ? "success" : "failure");
        }
        tr.appendChild(td);
    });
    return tr;
}

function getFinalSubmission(data) {
    if (!data.decisions) {
        return false;
    }
    const submissions = Object.keys(data.decisions).map((key) => {
        return data.decisions[key];
    }).sort((a, b) => {
        return b.timestamp - a.timestamp;
    });
    return submissions[0];
}

function getFirstSubmission(data) {
    if (!data.decisions) {
        return false;
    }
    const submissions = Object.keys(data.decisions).map((key) => {
        return data.decisions[key];
    }).sort((a, b) => {
        return a.timestamp - b.timestamp;
    });
    return submissions[0];
}

if (viewId === "party") {
    const leaderboardEl = document.querySelector("#leaderboard");
    const partyMsg = leaderboardEl.querySelector("p");
    if (localStorage.hasOwnProperty(GAME_PROPERTY)) {
        showEl(document.querySelector("#team-link"))
    }
    if (window.location.href.indexOf("?c=") > -1) {
        const party = window.location.href.split("?c=")[1].split("&")[0];
        fetch(`${API_ROOT}/api/party/fetch/${party}`).then((res) => {
            if (res.success) {
                const partyGames = Object.keys(res.games).map((k) => {
                    const data = res.games[k]
                    // const final = getFinalSubmission(data);
                    const final = getFirstSubmission(data);
                    const finalUnlockedMap = final.unlocked || {};
                    let possiblyPeekedEarly = false;
                    if (RESOLUTION_CLUE in finalUnlockedMap) {
                        const resolutionTimestamp = finalUnlockedMap[RESOLUTION_CLUE].at;
                        possiblyPeekedEarly = resolutionTimestamp < final.timestamp;
                    }
                    const cluesUnlocked = Object.keys(finalUnlockedMap).filter((c) => {
                        return !(c in ignoreClues);
                    }).length;
                    const systemsDeactivated = Object.keys(final.systems || {}).filter(k => final.systems[k] === false).length;
                    const correct = btoa(final.suspect) === "U2hvcHBlciAjNjg3MQ==";
                    return {
                        ...data,
                        id: k,
                        final,
                        cluesUnlocked,
                        systemsDeactivated,
                        correct,
                        possiblyPeekedEarly,
                    };
                }).filter((d) => d.final).sort((a, b) => {
                    if ((a.correct && b.correct) || (!a.correct && !b.correct)) {
                        if (a.systemsDeactivated === b.systemsDeactivated) {
                            if (a.cluesUnlocked === b.cluesUnlocked) {
                                return (a.final.timestamp - a.started) - (b.final.timestamp - b.started);
                            } else {
                                return b.cluesUnlocked - a.cluesUnlocked;
                            }                            
                        } else {
                            return b.systemsDeactivated - a.systemsDeactivated;
                        }
                    } if (a.correct) {
                        return -1;
                    } else {
                        return 1;
                    }
                });
                if (partyGames.length > 0) {
                    const tableEl = document.createElement("table");
                    const thr = makeTableRowOf("th", [
                        "Player Names",
                        "Escape Time",
                        "Suspect Chosen",
                        "Systems Deactivated",
                        "Clues Unlocked",
                        "Suspect Rationale",
                        "Recommendations for Store",
                    ]);
                    tableEl.appendChild(thr);
                    const cluesTotal = sidebarClues.length;
                    partyGames.forEach((data) => {
                        const time = getTimeDiffData(data.final.timestamp, data.started);
                        const trd = makeTableRowOf("td", [
                            Object.keys(data.names).map((k) => data.names[k]).join(", "),
                            `${leftpad(time.mins)}:${leftpad(time.secs)}`,
                            data.final.suspect,
                            `${data.systemsDeactivated}/3`,
                            `${data.cluesUnlocked}/${cluesTotal}`,
                            data.possiblyPeekedEarly ? `(**Automatically Generated System Note:** This team may have peeked at the resolution before submitting their suspect. Feel free to dispute and discuss with the other teams.)\n\n${data.final.rationale}` : data.final.rationale,
                            data.final.recommendations,
                        ], {
                            1: time.mins < 60,
                            2: data.correct,
                            3: data.systemsDeactivated > 0,
                            4: data.cluesUnlocked === cluesTotal,
                        });
                        tableEl.appendChild(trd);
                    });
                    leaderboardEl.innerHTML = "";
                    leaderboardEl.appendChild(tableEl);
                } else {
                    showMessage(partyMsg, false, `No completed games found for party: ${party}`);
                }
            } else {
                showMessage(partyMsg, false, `No completed games found for party: ${party}`);
            }
        });
    } else {
        showMessage(partyMsg, false, `No party code found. Do you have the right link?`);
    }
}

if (viewId === "admin") {
    const partyMsg = document.querySelector("#party-message");
    const submitBtn = document.querySelector("#party-submit");
    const adminInput = document.querySelector("#admin-secret");
    const partyInput = document.querySelector("#party");
    const gatewaysTextarea = document.querySelector("#gateways");
    submitBtn.addEventListener("click", (e) => {
        const party = partyInput.value;
        const gatewayCodes = gatewaysTextarea.value;
        const secret = adminInput.value;
        if (party && gateways && secret) {
            const gateways = gatewayCodes.trim().split("\n").map((t) => t.trim()).join(",");
            const reqUrl = `${API_ROOT}/api/party/add/${party}?gateways=${encodeURIComponent(gateways)}&admin=${encodeURIComponent(btoa(secret))}`;
            fetch(reqUrl).then((res) => {
                showMessage(partyMsg, res.success, res.message);
            });
        } else {
            showMessage(partyMsg, false, "Missing password, party ID, or game codes.");
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
    const msgStart = document.querySelector("#start-message");
    startBtn.addEventListener("click", (e) => {
        if (localStorage.getItem(FLAG_GAME_NOT_STARTED) === "false") {
            window.location = `${SITE_ROOT}/case/info`;
        } else {
            fetch(`${API_ROOT}/api/game/start/${gameId}`).then((res) => {
                if (!res.success) {
                    console.error(res);
                    showMessage(msgStart, false, "Failed to start game. Please reload and try again.");
                }
            }).catch((err) => {
                console.error(err);
                showMessage(msgStart, false, "Failed to start game. Please reload and try again.");
            });
        }
    });
    // Create Shared Notepad
    const showDriveError = (el) => {
        el.innerHTML = "";
        const a = document.createElement("a");
        a.target = "_blank";
        a.rel = "noopener";
        a.href = "https://myaccount.google.com/permissions";
        a.innerText = "myaccount.google.com/permissions"
        const s1 = document.createElement("span");
        s1.innerText = "Sorry, we didn't get your permission. Possibly because this account has already been used. Try using a different Google account or visit ";
        const s2 = document.createElement("span");
        s2.innerText = " to revoke this account's permission and try again.";
        el.appendChild(s1);
        el.appendChild(a);
        el.appendChild(s2);
        if (el.classList.contains("success")) {
            el.classList.remove("success");
        }
        el.classList.add("failure");
    }
    const docMsg = document.querySelector("#doc-message");
    const docBtn = document.querySelector("#create-doc");
    const redirect = `${SITE_ROOT}/intro`;
    docBtn.addEventListener("click", (e) => {
        showMessage(docMsg, true, "Requesting permission to create a Google Doc... This may take a moment.")
        fetch(`${API_ROOT}/api/notepad/authorize/${gameId}?redirect=${encodeURIComponent(redirect)}`).then((res) => {
            if (res.success) {
                showMessage(docMsg, true, res.message);
                setTimeout(() => {
                    window.location = res.url;
                }, 1000);
            } else {
                showDriveError(docMsg);
            }
        }).catch((err) => {
            showDriveError(docMsg);
        });
    });
    if (window.location.href.indexOf("code=") > -1) {
        const authCode = window.location.href.split("code=")[1].split("&")[0];
        showMessage(docMsg, true, "Permission granted. Creating your shared notepad. This may take a moment."); 
        fetch(`${API_ROOT}/api/notepad/create/${gameId}?code=${encodeURIComponent(authCode)}&redirect=${encodeURIComponent(redirect)}`).then((res) => {
            if (res.success) {
                showMessage(docMsg, true, res.message);
                setTimeout(() => {
                    window.location = redirect;
                }, 1000);
            } else {
                showDriveError(docMsg);
            }
        }).catch((err) => {
           showDriveError(docMsg);
       });
    }
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
                clearLocalGameData();
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
        const gatewayInput = document.querySelector("#gateway-input");
        const gatewayMsg = document.querySelector("#gateway-message");
        const button = document.querySelector("#create-game .button");
        const submitCreate = (e) => {
            if (!gatewayInput.value) {
                showMessage(gatewayMsg, false, "Please enter your game access code.");
                return;
            }
            const gateway = encodeURIComponent(gatewayInput.value);
            fetch(`${API_ROOT}/api/game/create?gateway=${gateway}`).then((res) => {
                if (res.success) {
                    showMessage(gatewayMsg, true, "Success. Creating game.");
                    setNewGameID(res.gameId);
                    window.location = `${SITE_ROOT}?join=${res.gameId}`;
                } else {
                    showMessage(gatewayMsg, false, res.message || "Failed to create game.");
                }
            }).catch((err) => {
                showMessage(gatewayMsg, false, "Failed to create game. Contact vingkan@gmail.com for help.");
            });
        };
        button.addEventListener("click", submitCreate);
        gatewayInput.addEventListener("keypress", (e) => {
            if (e.keyCode === 13) {
                submitCreate();
            }
        });
    }
}

if (viewId === "intro") {
    doIntro();
}

if (viewId === "discussion") {
    doDiscussion();
}

function getTimeDiffData(end, start) {
    const ms = end - start;
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor((totalSecs / 60));
    const secs = totalSecs % 60;
    return { mins, secs };
}

function getTimeLabel(diff) {
    const { mins, secs } = diff;
    const label = `${mins} min${mins === 1 ? "" : "s"}, ${secs} sec${secs === 1 ? "" : "s"}`;
    return label;
}

function showResults(discussionEl, data, finalSubmission, gameId, userId) {
    hideEl(discussionEl.querySelector("#discussion-entry"));
    hideEl(discussionEl.querySelector("#mission-box"));
    showEl(discussionEl.querySelector("#conclusion"));
    const concEl = discussionEl.querySelector("#conclusion");
    const discData = data.discussion || {};
    const nameMap = data.names || {};
    const gameMissionMap = data.missions || {};
    if (finalSubmission && concEl.getAttribute("data-state") === "empty") {
        concEl.setAttribute("data-state", "filled");
        if (data.party) {
            const partyLinkHolder = document.querySelector("#party-link");
            const partyLink = partyLinkHolder.querySelector("a");
            partyLink.href = `./party?c=${data.party}`;
            showEl(partyLinkHolder);
        }
        const resTimeEl = document.querySelector("#results-time");
        const resSusEl = document.querySelector("#results-suspect");
        const timeDiff = getTimeDiffData(finalSubmission.timestamp, data.started);
        resTimeEl.innerText = getTimeLabel(timeDiff);
        resSusEl.innerText = finalSubmission.suspect;
        document.querySelector("#results-rationale").innerText = finalSubmission.rationale;
        document.querySelector("#results-recommendations").innerText = finalSubmission.recommendations;
        if (timeDiff.mins <= 59) {
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
        let nOn = 0;
        let nOff = 0;
        systemIds.forEach((sid) => {
            const sysEl = concEl.querySelector(`[data-system=${sid}] .status`);
            const wasActive = !(sid in sysMap) || sysMap[sid];
            if (wasActive) {
                sysEl.classList.add("success");
                sysEl.innerText = `ACTIVE`;
                nOn++;
            } else {
                sysEl.classList.add("failure");
                sysEl.innerText = `DEACTIVATED`;
                nOff++;
            }
        });
        const spanOn = document.querySelector("#results-on");
        const spanOff = document.querySelector("#results-off");
        spanOn.innerText = `${nOn} system${nOn === 1 ? "" : "s"} active`;
        spanOff.innerText = `deactivated ${nOff} system${nOff === 1 ? "" : "s"}`;
        const resCluEl = document.querySelector("#results-clues");
        if (resCluEl.getAttribute("data-state") === "empty") {
            const unlockedMap = finalSubmission.unlocked || {};
            let clueCount = 0;
            resCluEl.setAttribute("data-state", "filled");
            sidebarClues.map((clueId) => {
                if (clueId in unlockedMap) {
                    return { clueId, ...unlockedMap[clueId] };
                }
                return { clueId };
            }).sort((a, b) => {
                if (a.at && b.at) {
                    return a.at - b.at;
                } else if (a.at) {
                    return -1;
                } else if (b.at) {
                    return 1;
                } else {
                    return 0;
                }
            }).forEach((clueResult) => {
                const clueId = clueResult.clueId
                const clueResHtml = `
                    <div class="clue">
                        <i class="fa fa-key"></i>
                    </div>
                    <div class="clue-status">
                        <strong>${clueId} </strong>
                        <span data-span="by"></span>
                        <span data-span="at"></span>
                    </div>
                `;
                const div = document.createElement("div");
                div.classList.add("row-half");
                div.innerHTML = clueResHtml;
                const sc = div.querySelector("span[data-span=by]");
                const su = div.querySelector("span[data-span=at]");
                const ci = div.querySelector(".clue");
                if (clueId in unlockedMap) {
                    clueCount++;
                    ci.classList.add("unlocked");
                    const unlockDiff = getTimeDiffData(clueResult.at, data.started);
                    const unlockedBy = nameMap[clueResult.by];
                    const unlockedAt = getTimeLabel(unlockDiff);
                    sc.innerText = `unlocked by ${unlockedBy}`;
                    su.innerText = `after ${unlockedAt}`;
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
    }
    // Update in real-time: mission voting results.
    const popularMap = {};
    const voteMap = discData.votes || {};
    Object.keys(voteMap).forEach((otherUserId) => {
        Object.keys(voteMap[otherUserId]).forEach((missionId) => {
            const votedForId = voteMap[otherUserId][missionId];
            // Skip votes for yourself
            if (otherUserId !== votedForId) {
                if (!(votedForId in popularMap)) {
                    popularMap[votedForId] = {};
                }
                if (!(missionId in popularMap[votedForId])) {
                    popularMap[votedForId][missionId] = 0;
                }
                popularMap[votedForId][missionId]++;
            }
        });
    });
    const resMisEl = document.querySelector("#results-missions");
    resMisEl.innerHTML = "";
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

function leftpad(d) {
    const s = `${d}`;
    if (s.length < 2) {
        return `0${d}`;
    }
    return s;
}

function renderPlayerTracker(teammateId, nameMap, yourPage, theirPage) {
    const trackerEl = document.querySelector("#team-tracker");
    if (!trackerEl) {
        return;
    }
    if (!document.querySelector(`[data-teammate=${teammateId}]`)) {
        const div = document.createElement("div");
        const p = document.createElement("p");
        const pa = document.createElement("p");
        const a = document.createElement("a");
        div.setAttribute("data-teammate", teammateId);
        div.classList.add("player-tracker");
        p.classList.add("name");
        pa.classList.add("link")
        pa.appendChild(a);
        div.appendChild(p);
        div.appendChild(pa);
        trackerEl.appendChild(div);
    }
    const mateEl = document.querySelector(`[data-teammate=${teammateId}]`);
    mateEl.querySelector("p").innerText = nameMap[teammateId];
    mateEl.querySelector("a").innerText = theirPage.title;
    // Value of link already has preceding slash (for case of index), so just append to site root.
    mateEl.querySelector("a").href = `${SITE_ROOT}${theirPage.link}`;
    if (theirPage.link === yourPage.link) {
        if (!mateEl.classList.contains("same-page")) {
            mateEl.classList.add("same-page");
        }
    } else {
        if (mateEl.classList.contains("same-page")) {
            mateEl.classList.remove("same-page");
        }
    }
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
    const yourPage = getCurrentPage();
    // Set up clue sidebar
    if (sidebar) {
        sidebarClues.forEach((clueId) => {
            let clueEl = document.createElement("div");
            clueEl.setAttribute("data-clue", clueId);
            let iconEl = document.createElement("i");
            iconEl.classList.add("fa");
            iconEl.classList.add("fa-key");
            clueEl.appendChild(iconEl);
            let tagEl = document.createElement("span");
            tagEl.innerText = clueId;
            clueEl.appendChild(tagEl);
            clueEl.classList.add("clue");
            if (localStorage.hasOwnProperty(`panopticon_clue_${clueId}`)) {
                clueEl.setAttribute("data-state", "filled");
                clueEl.classList.add("unlocked");
                clueEl.addEventListener("click", (e) => {
                    window.location = `${SITE_ROOT}/secure/${clueId}`;
                });
            }
            cluesEl.appendChild(clueEl);
        });
    }
    // Set up team tracker sidebar
    const trackerEl = document.querySelector("#team-tracker");
    if (trackerEl) {
        if (localStorage.getItem(FLAG_GAME_NOT_STARTED) === "false") {
            showEl(trackerEl.parentElement);
            if (localStorage.hasOwnProperty("panopticon_player_list")) {
                const trackerPlayerList = JSON.parse(localStorage.getItem("panopticon_player_list"));
                trackerPlayerList.forEach((teammateId) => {
                    const localNameMap = {
                        [teammateId]: localStorage.getItem(`panopticon_player_name_${teammateId}`)
                    };
                    const localTheirPage = {
                        title: localStorage.getItem(`panopticon_player_page_${teammateId}`),
                        link: localStorage.getItem(`panopticon_player_link_${teammateId}`)
                    };
                    renderPlayerTracker(teammateId, localNameMap, yourPage, localTheirPage);
                });
            }            
        } else {
            hideEl(trackerEl.parentElement);
        }
    }
    // Listen for updates
    db.ref(`${FIREBASE_ROOT}/games/${gameId}`).on("value", (snap) => {
        const data = snap.val() || {};
        const unlockedMap = data.unlocked || {};
        // Enter the game
        if (viewId === "intro") {
            const msgStart = document.querySelector("#start-message");
            if (!data.started) {
                localStorage.setItem(FLAG_GAME_NOT_STARTED, true);
            }
            if (localStorage.getItem(FLAG_GAME_NOT_STARTED) !== "false" && data.started) {
                localStorage.setItem(FLAG_GAME_NOT_STARTED, false);
                let t = 3;
                showMessage(msgStart, true, `Countdown started. Taking you to the game in ${t}...`);
                const interval = setInterval(() => {
                    t--;
                    showMessage(msgStart, true, `Countdown started. Taking you to the game in ${t}...`);
                    if (t === 0) {
                        clearInterval(interval);
                        window.location = `${SITE_ROOT}/case/info`;
                    }
                }, 1000);
            }
        }
        // Update sidebar
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
                    timerEl.innerText = `${sign}${leftpad(minsLeft)}:${leftpad(secsLeft)}`;
                }
            };
            if (timerEl.getAttribute("data-state") !== "filled") {
                timerEl.setAttribute("data-state", "filled");
                updateTimer();
                setInterval(() => {
                    updateTimer();
                }, 1000);   
            }
            sidebarClues.forEach((clueId) => {
                const isUnlocked = clueId in unlockedMap;
                const clueEl = document.querySelector(`[data-clue=${clueId}]`);
                if (isUnlocked && clueEl.getAttribute("data-state") !== "filled") {
                    localStorage.setItem(`panopticon_clue_${clueId}`, unlockedMap[clueId].code);
                    clueEl.setAttribute("data-state", "filled");
                    clueEl.classList.add("unlocked");
                    clueEl.addEventListener("click", (e) => {
                        window.location = `${SITE_ROOT}/secure/${clueId}`;
                    });
                }
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
        // Hints
        if (tabId === "hints" && viewId === "case") {
            // Update status message
            sidebarClues.forEach((clueId) => {
                const msgEl = document.querySelector(`[data-clue=${clueId}] .message`);
                const isUnlocked = clueId in unlockedMap;
                showMessage(msgEl, isUnlocked, isUnlocked ? "Unlocked" : "Not Yet Unlocked");
            });
            // Show hints that have been used
            const maxHints = 3;
            const hintsMap = data.hints || {};
            const hintsRemainingEl = document.querySelector("#hints-remaining");
            const numHints = maxHints - Object.keys(hintsMap).length;
            hintsRemainingEl.innerText = `${numHints} hint${numHints === 1 ? "" : "s"}`;
            for (let clueId in hintsMap) {
                const btn = document.querySelector(`[data-clue=${clueId}] .button`);
                btn.classList.add("locked");
                btn.innerText = "Used";
                const platypusEl = document.querySelector(`[data-platypus=${clueId}]`);
                if (platypusEl.getAttribute("data-state") !== "filled") {
                    platypusEl.setAttribute("data-state", "filled");
                    const platypus = atob(platypusEl.innerText);
                    platypusEl.classList.remove("hidden");
                    platypusEl.classList.add("hint-text");
                    platypusEl.innerText = platypus;
                }
            }
        }
        // Get Name and Missions Data
        const nameMap = data.names || {};
        const gameMissionMap = data.missions || {};
        // Team Tracker
        if (trackerEl) {
            if (data.started) {
                showEl(trackerEl.parentElement);
                localStorage.setItem(`panopticon_player_list`, JSON.stringify(Object.keys(data.current)));
                for (let teammateId in data.current) {
                    const theirPage = data.current[teammateId];
                    localStorage.setItem(`panopticon_player_name_${teammateId}`, nameMap[teammateId]);
                    localStorage.setItem(`panopticon_player_page_${teammateId}`, theirPage.title);
                    localStorage.setItem(`panopticon_player_link_${teammateId}`, theirPage.link);
                    renderPlayerTracker(teammateId, nameMap, yourPage, theirPage);
                }                
            } else {
                hideEl(trackerEl.parentElement);
            }
        }
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
                    localStorage.setItem(FLAG_VIEWED_MISSION, true);
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
            // Shared Notepad
            if (data.doc) {
                const proTipEl = document.querySelector(".pro-tip");
                const missingDocEl = document.querySelector("#missing-doc");
                const createdDocEl = document.querySelector("#created-doc");
                const openLink = document.querySelector("#open-doc");
                openLink.target = "_blank";
                openLink.rel = "noopener";
                openLink.href = `https://docs.google.com/document/d/${data.doc}`;
                if (!proTipEl.classList.contains("success")) {
                    proTipEl.classList.add("success");
                }
                hideEl(missingDocEl);
                showEl(createdDocEl);
            }
        }
        // Discussion
        let finalSubmission = false;
        if (data.hasOwnProperty("decisions")) {
            const endLink = document.querySelector("#end-link");
            if (endLink) {
                showEl(endLink);
            }
            // finalSubmission = getFinalSubmission(data);
            finalSubmission = getFirstSubmission(data);
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
            const discData = data.discussion || {};
            const discVoteMap = discData.votes || {};
            const discSkipMap = discData.skipped || {};
            if (!data.discussion) {
                showEl(discussionEl.querySelector("#discussion-entry"));
                hideEl(discussionEl.querySelector("#mission-box"));
                hideEl(discussionEl.querySelector("#conclusion"));
                const startBtn = document.querySelector("#start-discussion");
                if (startBtn.getAttribute("data-state") === "nohook") {
                    startBtn.addEventListener("click", (e) => {
                        fetch(`${API_ROOT}/api/discussion/start/${gameId}`);
                    });
                    startBtn.setAttribute("data-state", "listening");
                }
            } else if (userId in discVoteMap || userId in discSkipMap) {
                showResults(discussionEl, data, finalSubmission, gameId, userId);
            } else if (discData.active) {
                hideEl(discussionEl.querySelector("#discussion-entry"));
                showEl(discussionEl.querySelector("#mission-box"));
                hideEl(discussionEl.querySelector("#conclusion"));
                const voteTableEl = document.querySelector(".mission-vote-table");
                if (voteTableEl.getAttribute("data-state") === "empty") {
                    voteTableEl.setAttribute("data-state", "filled");
                    MISSIONS.forEach((missionData) => {
                        const voteRowHtml = `
                            <div class="mission-vote-cell">
                                <p>${missionData.goal}</p>
                            </div>
                            <div class="mission-vote-cell form">
                                <select data-select="${missionData.id}">
                                    <option value="none" selected>No One</option>
                                </select>
                            </div>
                        `;
                        const voteRowEl = document.createElement("div");
                        voteRowEl.classList.add("mission-vote-row");
                        voteRowEl.innerHTML = voteRowHtml;
                        voteTableEl.appendChild(voteRowEl);
                        const selectEl = voteRowEl.querySelector(`[data-select="${missionData.id}"`);
                        Object.keys((gameMissionMap)).sort().forEach((missionUserId) => {
                            const opt = document.createElement("option");
                            opt.value = missionUserId;
                            opt.innerText = nameMap[missionUserId];
                            selectEl.appendChild(opt);
                        });
                    });
                    const voteBtn = document.querySelector("#vote-btn");
                    const voteSubMsg = document.querySelector("#vote-submit-msg");
                    voteBtn.addEventListener("click", (e) => {
                        const selectEls = document.querySelectorAll("[data-select]");
                        const voteMap = Array.from(selectEls).reduce((agg, val) => {
                            const missionId = val.getAttribute("data-select");
                            const userVote = val.value;
                            agg[missionId] = userVote;
                            return agg;
                        }, {});
                        const voteParam = encodeURIComponent(JSON.stringify(voteMap));
                        const reqUrl = `${API_ROOT}/api/discussion/vote/${gameId}?user=${userId}&vote=${voteParam}`;
                        fetch(reqUrl).then((res) => {
                            showMessage(voteSubMsg, res.success, res.message);
                        }).catch((err) => {
                            showMessage(voteSubMsg, false, "Failed to submit vote. Reload and try again.");
                        });
                    });
                    const skipBtn = document.querySelector("#skip-btn");
                    skipBtn.addEventListener("click", (e) => {
                        fetch(`${API_ROOT}/api/discussion/skip/${gameId}?user=${userId}`);
                    });
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
