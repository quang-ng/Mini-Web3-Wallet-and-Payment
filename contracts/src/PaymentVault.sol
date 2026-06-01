// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract PaymentVault {
    address public owner;
    mapping(address => uint256) public balances;
    mapping(address => bool) public hasAccount;
    mapping(address => mapping(address => uint256)) public tokenBalances;

    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event DepositToken(
        address indexed user,
        address indexed token,
        uint256 amount
    );
    event WithdrawToken(
        address indexed user,
        address indexed token,
        uint256 amount
    );
    event TransferETH(address indexed from, address indexed to, uint256 amount);
    event TransferToken(
        address indexed from,
        address indexed to,
        address indexed token,
        uint256 amount
    );
    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only onwer can call this!");
        _;
    }

    function registerAccount(address user) public onlyOwner {
        require(user != address(0), "Invalid address");
        hasAccount[user] = true;
    }

    function deposit() public payable {
        balances[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) public {
        require(balances[msg.sender] >= amount, "You dont have enough money");
        require(amount > 0, "Amount must be greater than 0");

        balances[msg.sender] -= amount;

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");

        emit Withdraw(msg.sender, amount);
    }

    function getBalance(address account) public view returns (uint256) {
        return balances[account];
    }

    function depositToken(address token, uint256 amount) public {
        require(token != address(0), "Invalid token address");
        require(amount > 0, "Amount must be greater than 0");

        bool success = IERC20(token).transferFrom(
            msg.sender,
            address(this),
            amount
        );
        require(success, "Token tranfer failed");

        tokenBalances[msg.sender][token] += amount;

        emit DepositToken(msg.sender, token, amount);
    }

    function withdrawToken(address token, uint256 amount) public {
        require(token != address(0), "Invalid token address");
        require(amount > 0, "Amount must be greater than 0");
        require(
            tokenBalances[msg.sender][token] >= amount,
            "Insufficient token balance"
        );

        // Update user's balance first
        tokenBalances[msg.sender][token] -= amount;

        // Transfer tokens FROM vault TO user
        bool success = IERC20(token).transfer(msg.sender, amount);
        require(success, "Token transfer failed");

        // Emit event
        emit WithdrawToken(msg.sender, token, amount);
    }

    function getTokenBalance(
        address account,
        address token
    ) public view returns (uint256) {
        return tokenBalances[account][token];
    }

    function transferETH(address payable to, uint256 amount) public {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        require(to != address(0), "Invalid address");
        require(amount > 0, "Amount must be greater than 0");
        require(hasAccount[to], "Recipient does not have an account");

        balances[msg.sender] -= amount;
        balances[to] += amount;

        emit TransferETH(msg.sender, to, amount);
    }

    function transferToken(address token, address to, uint256 amount) public {
        require(token != address(0), "Invalid token address");
        require(to != address(0), "Invalid recipient address");
        require(amount > 0, "Amount must be greater than 0");
        require(
            tokenBalances[msg.sender][token] >= amount,
            "Insufficient token balance"
        );
        require(hasAccount[to], "Recipient does not have an account");

        tokenBalances[msg.sender][token] -= amount;
        tokenBalances[to][token] += amount;

        emit TransferToken(msg.sender, to, token, amount);
    }
}
