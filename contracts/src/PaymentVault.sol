// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

contract PaymentVault {
    mapping(address => uint256) public balances;

    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw(uint256 amount) public {
        require(balances[msg.sender] >= amount, "You dont have enough money");
        require(amount > 0, "Amount must be greater than 0");

        balances[msg.sender] -= amount;

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");
    }

    function getBalance(address account) public view returns (uint256) {
        return balances[account];
    }
}
