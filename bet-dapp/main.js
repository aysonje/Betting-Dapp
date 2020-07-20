var web3 = new Web3(Web3.givenProvider);
var contractInstance;

let bets;
let results;

$(document).ready(function() {
    bets = [];
    results = {};

    window.ethereum.enable().then(function(accounts) {
        contractInstance = new web3.eth.Contract(abi, "0x3bCA9aa29b827c65DE3b27059659aB9ce5830670", {from: accounts[0]});

        getPot();

        $("#bet_submit").click(bet);
        $("#add_pot").click(addPot);

        contractInstance.events.betResult({}, {fromBlock: 0, toBlock: 'latest'}).on('data', function(event) {
            console.log(event.returnValues);
            const qId = event.returnValues[0];
            let result = event.returnValues[1];
            if (!bets.includes(qId)) bets.push(qId);
            results[qId] = result ? 'win' : 'lose';
            showBets();
        })

        contractInstance.events.betQueued(function(error, event) {
            console.log('queued', event.returnValues);
            const qId = event.returnValues[1];
            if (!bets.includes(qId)) {
                bets.push(qId);
                results[qId] = 'pending';
            }
            showBets();
            getPot();
        })

        contractInstance.events.betResult(function(error, event) {
            console.log(event.returnValues);
            const qId = event.returnValues[0];
            let result = event.returnValues[1];
            results[qId] = result ? 'win' : 'lose';
            showBets();
            getPot();
        })    
    });
});

function showBets() {
    let _bets = $('#bets');
    _bets.empty();
    for (var i=bets.length-1;i>=0;i--) {
        let bet = bets[i];
        let result = results[bet];
        item = `<li class="list-group-item"><span>${bet.slice(0, 10)}... ${result}</span></li>`;
        _bets.append(item);
    }
}

function addPot() {
    let config = {
        value: web3.utils.toWei("3", "ether")
    }
    contractInstance.methods.addBalance().send(config)
    .on("receipt", function(receipt) {
        getPot();
    })
}

function getPot() {
    contractInstance.methods.getBalance().call()
    .then(function(result) {
        $("#pot").text("Total Pot: " + web3.utils.fromWei(""+result, "ether") + " ETH");
    })
}

function bet() {
    let amount = "" + $("#bet_amount").val();
    $("#bet_amount").val("");
    let config = {
        value: web3.utils.toWei(amount, "ether")
    }

    contractInstance.methods.bet().send(config)
    .on("receipt", function(receipt) {
        getPot();
    })
}
