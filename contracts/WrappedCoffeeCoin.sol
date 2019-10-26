pragma solidity ^0.5.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";

contract WrappedCoffeeCoin is ERC20, ERC20Detailed {
    constructor() ERC20Detailed("Wrapped Coffee Coin", "WCC", 18) public {
    }
}