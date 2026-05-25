// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../src/PaymentVault.sol";

contract PaymentVaultTest is Test {
    PaymentVault vault;
    address user1 = address(0x1);
    address user2 = address(0x2);

    function setUp() public {
        vault = new PaymentVault();
        vm.deal(user1, 10 ether);
        vm.deal(user2, 10 ether);
    }

    // ===== DEPOSIT TESTS =====
    function test_deposit_works() public {
        vault.deposit{value: 1 ether}();
        assertEq(vault.balances(address(this)), 1 ether);
    }

    function test_deposit_multiple_times() public {
        vault.deposit{value: 1 ether}();
        vault.deposit{value: 2 ether}();
        assertEq(vault.balances(address(this)), 3 ether);
    }

    function test_deposit_different_users() public {
        vm.prank(user1);
        vault.deposit{value: 1 ether}();

        vm.prank(user2);
        vault.deposit{value: 2 ether}();

        assertEq(vault.balances(user1), 1 ether);
        assertEq(vault.balances(user2), 2 ether);
    }

    // ===== WITHDRAW TESTS =====
    function test_withdraw_works() public {
        vault.deposit{value: 2 ether}();
        vault.withdraw(1 ether);
        assertEq(vault.balances(address(this)), 1 ether);
    }

    function test_withdraw_all() public {
        vault.deposit{value: 1 ether}();
        vault.withdraw(1 ether);
        assertEq(vault.balances(address(this)), 0);
    }

    function test_withdraw_insufficient_balance() public {
        vault.deposit{value: 1 ether}();
        vm.expectRevert("You dont have enough money");
        vault.withdraw(2 ether);
    }

    function test_withdraw_zero_fails() public {
        vault.deposit{value: 1 ether}();
        vm.expectRevert("Amount must be greater than 0");
        vault.withdraw(0);
    }

    function test_withdraw_returns_eth() public {
        vault.deposit{value: 1 ether}();
        uint256 balanceBefore = address(this).balance;

        vault.withdraw(1 ether);
        uint256 balanceAfter = address(this).balance;

        assertEq(balanceAfter, balanceBefore + 1 ether);
    }

    // ===== INTEGRATION TESTS =====
    function test_deposit_withdraw_cycle() public {
        // Deposit
        vault.deposit{value: 3 ether}();
        assertEq(vault.balances(address(this)), 3 ether);

        // Withdraw half
        vault.withdraw(1.5 ether);
        assertEq(vault.balances(address(this)), 1.5 ether);

        // Withdraw rest
        vault.withdraw(1.5 ether);
        assertEq(vault.balances(address(this)), 0);
    }

    function test_multiple_users_independent() public {
        vm.prank(user1);
        vault.deposit{value: 5 ether}();

        vm.prank(user2);
        vault.deposit{value: 3 ether}();

        vm.prank(user1);
        vault.withdraw(2 ether);

        assertEq(vault.balances(user1), 3 ether);
        assertEq(vault.balances(user2), 3 ether);
    }

    function test_getBalance_work() public {
        vault.deposit{value: 2.5 ether}();
        assertEq(vault.getBalance(address(this)), 2.5 ether);
    }

    receive() external payable {}
}
