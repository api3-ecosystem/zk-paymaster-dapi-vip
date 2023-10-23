// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";

contract VIPNFT is ERC1155, ERC1155Burnable {
    constructor() ERC1155("string") {}

    function mint(address account) public{
        _mint(account, 1, 1, "");
    }

    function name() public pure returns (string memory) {
        return "VIP Gas Token";
    }

    function symbol() public pure returns (string memory) {
        return "VIP";
    }
}
