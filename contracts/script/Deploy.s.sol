// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "../src/PaymentVault.sol";

contract Deploy is Script {
    function run() public {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerKey);
        
        PaymentVault vault = new PaymentVault();
        
        vm.stopBroadcast();
        
        console.log("PaymentVault deployed to:", address(vault));
    }
}
