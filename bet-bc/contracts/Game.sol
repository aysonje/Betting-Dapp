pragma solidity 0.5.12;
import "./provableAPI.sol";

contract Game is usingProvable {
    uint private balance;

    mapping(bytes32 => uint) queryBets;
    mapping(bytes32 => address payable) queryWho;
    mapping(bytes32 => bool) queryResults;

    event betResult(bytes32, bool);
    event betQueued(address, bytes32);
    
    function addBalance() public payable {
        require(msg.value > 0);
        balance += msg.value;
    }
    
    function getBalance() public view returns(uint) {
        return balance;
    }

    function __callback(bytes32 _queryId, string memory _result, bytes memory _proof) public {
        require(msg.sender == provable_cbAddress());

        uint256 randomNumber = uint256(keccak256(abi.encodePacked(_result))) % 2;
        bool result = (randomNumber == 1);
        queryResults[_queryId] = result;
        if (result) {
            uint bet = queryBets[_queryId];
            uint reward = 2 * bet;
            balance -= bet;
            queryWho[_queryId].transfer(reward);
        } else {
            // do nothing
        }

        emit betResult(_queryId, result);
    }
    
    function bet() public payable {
        require(msg.value >= 0.01 ether);
        require(balance >= msg.value + 0.01 ether);
        balance += msg.value;

        bytes32 queryId = provable_newRandomDSQuery(0, 1, 200000);
        queryBets[queryId] = msg.value;
        emit betQueued(msg.sender, queryId);

        // bool result = didWin();
        // if (result) {
        //     balance -= reward;
        //     msg.sender.transfer(reward);
        //     emit betResult(msg.sender, true);
        // } else {
        //     emit betResult(msg.sender, false);
        // }
    }
    
    function didWin() public view returns(bool) {
        return (now % 2) == 1;
    }
}