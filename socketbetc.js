let countTrades = 0;
let socketBetc = new WebSocket("streamer.betc");
socketBetc.onopen = function (e) {
    console.log("[open] Connection established");
}

socketBetc.onmessage = function (event) {
    // console.log(`[message] Data received from server: ${event.data}`);
    // console.log(event.data);
    let betcTrade = JSON.parse(event.data);
    checkDeviation(betcTrade);

}


socketBetc.onclose = function (event) {
    displayError(event);
    if (event.wasClean) {
        console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
    } else {
        // e.g. server process killed or network down
        // event.code is usually 1006 in this case
        console.log('[close] Connection died');
    }
}

socketBetc.onerror = function (error) {
    console.log(`[error] ${error.message}`);

};


function checkDeviation(betcTrade) {
    let currentBetcRate = Math.round(betcTrade.lastPrice * 100) / 100;
    let deviation = Math.round((currentBinanceRate - currentBetcRate) * 100) / 100;
    if (deviation > 2) {
        displayDeviationList(deviation);
        // sendToSlack(`Deviation: ${deviation}, time:${betcTrade.time}`)
    }
    countTrades += 1;
    $('#deviationP').html(deviation);
    $('#checkedTrades').html(countTrades)
}

function displayDeviationList(deviation) {
    let today = new Date();
    let time = today.getDate() + '/' + (today.getMonth() + 1) + ' | ' + today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds() + "." + today.getMilliseconds();
    let row = `<p>${time} - ${deviation}</p><hr>`;
    $('#devitionList').prepend(row);
}