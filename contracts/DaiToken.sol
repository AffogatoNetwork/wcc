pragma solidity ^0.5.11;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Mintable.sol";
import "@openzeppelin/contracts/ownership/Ownable.sol";

contract DaiToken is ERC20Detailed, ERC20Mintable, Ownable {
  constructor() ERC20Detailed("Dai Stablecoin v1.0 TEST", "DAI", 18) public {}

  function faucet(uint amount) public{
    _mint(msg.sender, amount);
  }
}
