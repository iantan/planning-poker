"use strict";
import {html, render} from 'https://unpkg.com/lit-html?module';

window.init = function () {
    generatePokerDeck();
    loadResult([]);
};

function generatePokerDeck() {
    const pokerCards = [0, 1, 2, 3, 5, 8, 13, 20, 40, 100, '?', 'infinity'];
    const card = (item) => html`
        <label class="btn btn-warning" style="padding: 30px; border:5px solid white;">
            <input type="radio" name="selected-card" onclick="scoreIt('${item}')">${item === 'infinity' ? '\u221e' : item}</input>
        </label>
        `;
    const pokerCardsTemplate = html`${pokerCards.map((item) => card(item))}`;
    render(pokerCardsTemplate, document.getElementById("cards"));
}
;

function loadResult(scores) {
    const result = (item) => html`
        <div class="col text-center">
            <div><h5>${item.name}</h5></div>
            <div id="card-container">
                <div id="card">
                    <div class="front">
                        <div class="number">${item.score === 'infinity' ? '\u221e' : item.score}</div>
                    </div>
                    <div class="${item.score === '' ? 'back-no-score' : 'back-has-score'}">
                    </div>
                </div>
            </div>
        </div>
        `;
    
    var voteTemplate = html`<div class="col text-center"><h6>Waiting for votes...</h6></div>`;
    if (scores && scores.length > 0){
        voteTemplate = html`${scores.map((item) => result(item))}`;
    }
    render(voteTemplate, document.getElementById("resultSection"));
}

// WEBSOCKET
var socket;
var connected = false;
window.connect = function () {
    const user = document.getElementById("user").value;
    const isPlayer = document.getElementById("isPlayer").checked;
    if (user.length < 1)
        return;

    if (!connected) {
        socket = new WebSocket("ws://" + location.host + "/poker-socket/" + user + "/" + isPlayer);
        socket.onopen = function () {
            console.log("Connected to the web socket");
            connected = true;
            document.getElementById("user").readOnly = true;
            document.getElementById("isPlayer").disabled = true;
            document.getElementById("btnConnect").style.display = "none";
            document.getElementById("btnLogout").style.display = "inline";
            document.getElementById("clickToScore").style.display = isPlayer ? "inline" : "none";
            document.getElementById("showResults").style.display = isPlayer ? "none" : "inline";
        };
        socket.onmessage = function (m) {
            var resp = JSON.parse(m.data);
            console.log(resp);

            loadResult(resp.scores);
            document.getElementById("btnShowResults").style.display = resp.allVotesAreIn ? "inline" : "none";

            if (resp.showResults) {
                $('.front').addClass('rotatefront');
                $('.back-has-score').addClass('rotateback');
                document.getElementById("btnShowResults").style.display = "none";
            }
        };
    }
};

window.scoreIt = function (myScore) {
    var message = '{"score":"' + myScore + '"}';
    if (connected) {
        socket.send(message);
    }
};

window.reset = function () {
    if (connected) {
        socket.send("reset");
        areResultsShowing = false;
    }
};

window.logout = function () {
    if (connected) {
        socket.close();
        connected = false;
    }
    areResultsShowing = false;
    document.getElementById("user").readOnly = false;
    document.getElementById("isPlayer").disabled = false;
    document.getElementById("btnConnect").style.display = "inline";
    document.getElementById("btnLogout").style.display = "none";
    loadResult([]);
};

var areResultsShowing = false;
window.showResults = function () {
    if (connected && !areResultsShowing) {
        socket.send("showResults");
        areResultsShowing = true;
    }
}