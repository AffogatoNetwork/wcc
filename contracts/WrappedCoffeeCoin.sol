pragma solidity ^0.5.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";
import "@openzeppelin/contracts/ownership/Ownable.sol";

contract WrappedCoffeeCoin is ERC20, ERC20Detailed, Ownable {

    address public _DAI_CONTRACT;
    address public _COFFEE_HANDLER_CONTRACT;

    constructor() ERC20Detailed("Wrapped Coffee Coin", "WCC", 0) public {
    }

    /**
     * @dev See `ERC20._mint`.
     *
     * Requirements:
     *
     * - the caller must have the `MinterRole`.
     
    function mint(address account, uint256 amount) public onlyMinter returns (bool) {
        _mint(account, amount);
        return true;
    }*/
}