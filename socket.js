//https://hooks.slack.com/services/
//   socket - Binance Response
// {
//     "e": "trade",     // Event type
//     "E": 123456789,   // Event time
//     "s": "BNBBTC",    // Symbol
//     "t": 12345,       // Trade ID
//     "p": "0.001",     // Price
//     "q": "100",       // Quantity
//     "b": 88,          // Buyer order ID
//     "a": 50,          // Seller order ID
//     "T": 123456785,   // Trade time
//     "m": true,        // Is the buyer the market maker?
//     "M": true         // Ignore
//   }

// socketDaylyChange response
// {
//     "e": "24hrTicker",  // Event type
//     "E": 123456789,     // Event time
//     "s": "BNBBTC",      // Symbol
//     "p": "0.0015",      // Price change
//     "P": "250.00",      // Price change percent
//     "w": "0.0018",      // Weighted average price
//     "x": "0.0009",      // First trade(F)-1 price (first trade before the 24hr rolling window)
//     "c": "0.0025",      // Last price
//     "Q": "10",          // Last quantity
//     "b": "0.0024",      // Best bid price
//     "B": "10",          // Best bid quantity
//     "a": "0.0026",      // Best ask price
//     "A": "100",         // Best ask quantity
//     "o": "0.0010",      // Open price
//     "h": "0.0025",      // High price
//     "l": "0.0010",      // Low price
//     "v": "10000",       // Total traded base asset volume
//     "q": "18",          // Total traded quote asset volume
//     "O": 0,             // Statistics open time
//     "C": 86400000,      // Statistics close time
//     "F": 0,             // First trade ID
//     "L": 18150,         // Last trade Id
//     "n": 18151          // Total number of trades
//   }

let arrOfTrades = [];
let tradesAmount1Sec = [];
let tradesAmount1Min = [];
let tradesAmount1Hour = [];
let currentBinanceRate;

// trades
let socket = new WebSocket("wss://stream.binance.com:9443/ws/btcusdt@trade");
socket.onopen = function (e) {
    console.log("[open] Connection established");
}

socket.onmessage = function (event) {
    // console.log(`[message] Data received from server: ${event.data}`);
    let binanceTrade = JSON.parse(event.data);
    displayBinanceRate(binanceTrade);
    tradesAmount1Sec.push(binanceTrade);
    tradesAmount1Min.push(binanceTrade);

    // console.log(tradesAmount1Sec);
    checkDifRate(binanceTrade);
}


socket.onclose = function (event) {
    displayError(event);
    if (event.wasClean) {
        console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
    } else {
        // e.g. server process killed or network down
        // event.code is usually 1006 in this case
        console.log('[close] Connection died');
    }
}

socket.onerror = function (error) {
    console.log(`[error] ${error.message}`);
    displayError(error);
};


// dayly change
let socketDaylyChange = new WebSocket("wss://stream.binance.com:9443/ws/btcusdt@ticker");
socketDaylyChange.onopen = function (e) {
    console.log("[open] Connection established");
}

socketDaylyChange.onmessage = function (event) {
    // console.log(`[message] Data received from server: ${event.data}`);
    let tradeObj = JSON.parse(event.data);
    displayDyalyChange(tradeObj);
    //checkDifRate(tradeObj);
}


socketDaylyChange.onclose = function (event) {
    if (event.wasClean) {
        console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
    } else {
        // e.g. server process killed or network down
        // event.code is usually 1006 in this case
        console.log('[close] Connection died');
    }
}


socketDaylyChange.onerror = function (error) {
    console.log(`[error] ${error.message}`);
};


function displayBinanceRate(trade) {
     currentBinanceRate = Math.round(trade.p * 100) / 100;
    // currentBinanceRate = roundedPrice;
    let utcDate = new Date(trade.T).toUTCString();
    $('#dateOfTrade').html(utcDate);
    $('#rateBTC').html(currentBinanceRate);
}

function checkDifRate(trade) {
    arrOfTrades.unshift(trade);
    let currentDifRate = (arrOfTrades[0].p - arrOfTrades[1].p);
    let difRateRounded = Math.round(currentDifRate * 100) / 100;
    let difRate = Math.abs(difRateRounded);
    let msg;
    displayChange('changeRateValue', difRateRounded);
    if (10 < difRate && difRate < 15) {
        msg = `Low difference = ${difRateRounded}`;
        sendToSlack(msg);
        console.log(`dif rate is 10 < difRate < 15`);
    } else if (16 < difRate && difRate < 25) {
        console.log(`11 < difRate < 20`);
        msg = `Medium difference = ${difRateRounded}`;
        sendToSlack(msg);
    } else if (26 < difRate) {
        msg = `High difference = ${difRateRounded}`;
        sendToSlack(msg);
    }

    if (3 < difRate) {
        lastBiggestRateChange(difRateRounded);
    }

    arrOfTrades.splice(1, 1);
}


function displayChange(p, trade) {
    if (trade > 0) {
        $(`#${p}`).html(trade).css('color', 'green');
    } else {
        $(`#${p}`).html(trade).css('color', 'red');
    }
}


function lastBiggestRateChange(difRate) {
    displayChange('lastBiggestChange', difRate);
    displayChangesList(difRate);
};


function displayChangesList(difRate) {
    let tr = `<p>${difRate}</p><hr>`;
    $('#listOfCHanges').prepend(tr);
}

function displayError(msg) {
    $('#errorP').html(`Connection is down - ${msg}`)
}

setInterval(() => {
    ratesFlowTest()
}, 1000 * 60 * 3);


function ratesFlowTest() {
    let curTime = (new Date()).valueOf();
    let difTime = (curTime - arrOfTrades[0].T);
    console.log(curTime);
    console.log(arrOfTrades[0].T);
    console.log(difTime);
    let msg;
    if (difTime > (1000 * 60 * 3)) {
        console.log("feed is stuck");
        msg = 'Binance Feed is Stuck!';
        sendToSlack(msg);
    } else {
        msg = "Binance feed is running!";

    }
    displayChecksList(msg);
}


function displayChecksList(msg) {
    let today = new Date();
    let time = today.getDate() + '/' + (today.getMonth() + 1) + ' | ' + today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    console.log(time);
    let row = `<p>${time} - ${msg}</p><hr>`;
    $('#binanceChecksList').prepend(row);
    if (msg === 'Binance Feed is Stuck!') {
        $('#binanceChecksList').css('color', 'red');
    } else {
        $('#binanceChecksList').css('color', 'black');
    }
}

function sendToSlack(msg) {
    console.log('sended to slack')
    let url = 'https://hooks.slack.com/services/' // url to send msg 
    let text = msg;
    $.ajax({
        data: 'payload=' + JSON.stringify({
            "text": text
        }),
        dataType: 'json',
        processData: false,
        type: 'POST',
        url: url
    });
}

function displayDyalyChange(obj) {
    let usdtChange = Math.round(obj.p * 100) / 100;
    let perChange = Math.round(obj.P * 100) / 100;
    $('#daylyChangeP').html(`24h Change: ${usdtChange} | ${perChange}%`).css('color', '#200c91');

    if (usdtChange < 0) {
        $('#daylyChangeP').css('color', 'red')
    }
}

setInterval(() => {

    if (tradesAmount1Sec.length > 100) {
        let msg = `Number of trades 1 sec: ${tradesAmount1Sec.length}`;
        // sendToSlack(msg);
    }
    $('#tradesPerSecond').html(`${tradesAmount1Sec.length}`);
    tradesAmount1Sec = [];
}, 1000);


setInterval(() => {
    console.log('1 minute ' + tradesAmount1Min.length);
    if (tradesAmount1Min.length > 3000) {
        let msg = `Number of trades 1 Min(Normal ~ 600-800): ${tradesAmount1Min.length}`
        // sendToSlack(msg);
    }
    $('#tradesPerMinute').html(`${tradesAmount1Min.length}`);
    tradesAmount1Min = [];

}, 1000 * 60);


setInterval(() => {
    console.log('1 hour ' + tradesAmount1Hour.length);
    if (tradesAmount1Hour.length > 1500) {
        let msg = `Number of trades 1 Hour: ${tradesAmount1Hour.length}`
        sendToSlack(msg);
    }
    $('#tradesPerHour').html(`${tradesAmount1Hour.length}`);
    tradesAmount1Hour = [];

}, 1000 * 60 * 60);
