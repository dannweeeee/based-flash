// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FlashblocksNFT is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;
    
    event NFTMinted(address owner, uint256 tokenId, string tokenURI);

    constructor() ERC721("FlashblocksNFT", "FLASH") Ownable(msg.sender) {}

    function mintNFT(string memory tokenURI) public returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        
        _mint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);
        
        emit NFTMinted(msg.sender, tokenId, tokenURI);
        
        return tokenId;
    }
}
