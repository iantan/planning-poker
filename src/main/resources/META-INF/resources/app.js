"use strict";
import {html, render} from 'https://unpkg.com/lit-html?module';

window.init = function () {
    generatePokerDeck();
    loadResult([]);
    document.getElementById("divMain").style.display = "none";
};

function generatePokerDeck() {
    const pokerCards = [0, '½', 1, 2, 3, 5, 8, 13, 20, 40, 100, '?'];
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
    if (scores && scores.length > 0) {
        voteTemplate = html`${scores.map((item) => result(item))}`;
    }
    render(voteTemplate, document.getElementById("resultSection"));
}

// WEBSOCKET
var socket;
var connected = false;
window.connect = function (varIsPlayer) {
    const user = document.getElementById("user").value;
    const isPlayer = varIsPlayer;
    if (user.length < 1)
        return;

    if (!connected) {
        socket = new WebSocket("ws://" + location.host + "/poker-socket/" + user + "/" + isPlayer);
        socket.onopen = function () {
            connected = true;
            document.getElementById("user").readOnly = true;
            document.getElementById("lblConnectAs").style.display = "none";
            document.getElementById("btnPlayer").style.display = "none";
            document.getElementById("btnDealer").style.display = "none";
            document.getElementById("btnLogout").style.display = "inline";
            document.getElementById("divMain").style.display = "inline";
            document.getElementById("divInitMain").style.display = "none";
            document.getElementById("clickToScore").style.display = isPlayer ? "inline" : "none";
            document.getElementById("showResults").style.display = isPlayer ? "none" : "inline";
        };
        socket.onmessage = function (m) {
            var resp = JSON.parse(m.data);
            loadResult(resp.scores);

            document.getElementById("btnShowResults").style.visibility = resp.allVotesAreIn ? "visible" : "hidden";
            $("input[type=radio]").attr('disabled', false);

            if (resp.showResults) {
                $('.front').addClass('rotatefront');
                $('.back-has-score').addClass('rotateback');
                document.getElementById("btnShowResults").style.visibility = "hidden";
                
                if (hasScored(resp.scores)) {
                    $("input[type=radio]").attr('disabled', true);
                }
            }
        };
    }
};

function hasScored(scores){
    var hasScored = false;
    scores.map((item) => {
        if (item.name === $("#user").val() && item.score !== '') {
            hasScored = true;
        }
    });
    return hasScored;
}

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
    document.getElementById("lblConnectAs").style.display = "inline";
    document.getElementById("btnPlayer").style.display = "inline";
    document.getElementById("btnDealer").style.display = "inline";
    document.getElementById("btnLogout").style.display = "none";
    document.getElementById("divMain").style.display = "none";
    document.getElementById("divInitMain").style.display = "inline";
    loadResult([]);
};

var areResultsShowing = false;
window.showResults = function () {
    if (connected && !areResultsShowing) {
        socket.send("showResults");
        areResultsShowing = true;
    }
}