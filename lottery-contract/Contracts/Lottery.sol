pragma solidity ^0.4.26;
contract Lottery {
    address public manager;
    address[] public players;

    constructor() public {
        manager = msg.sender;
    }

    function enter() public payable {
        require(msg.value > 0.01 ether);
        players.push(msg.sender);
    }

    function random() private view returns (uint256) {
        bytes32 output =
            keccak256(abi.encodePacked(block.difficulty, now, players));
        return uint256(output);
    }

    function pickWinner() public restricted {
        uint256 index = random() % players.length;
        address winner = players[index];
        winner.transfer(address(this).balance);
        players = new address[](0);
    }

    modifier restricted() {
        require(msg.sender == manager);
        _;
    }

    function getPlayers() public view returns (address[]) {
        return players;
    }
}
