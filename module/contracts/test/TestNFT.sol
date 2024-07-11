// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.12 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract SafePassKeyNFT is ERC721 {

  constructor(string memory name, string memory symbol) ERC721(name, symbol) {}

   uint256 count = 0;


  // The mint function mints an NFT to the specified address.
  function mint() public {
    // Check if the specified address is valid.
    // Mint the NFT.
    _mint(msg.sender, uint256(count));
    count++;

  }
}