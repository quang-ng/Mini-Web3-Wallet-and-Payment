// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "../src/PaymentVault.sol";
import "../src/SimpleToken.sol";

contract Deploy is Script {
    function run() public {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerKey);

        PaymentVault vault = new PaymentVault();
        SimpleToken token = new SimpleToken(1000000);
        console.log("SimpleToken deployed to : ", address(token));

        vm.stopBroadcast();

        console.log("PaymentVault deployed to:", address(vault));
    }
}
