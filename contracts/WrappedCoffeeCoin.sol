pragma solidity ^0.5.11;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";
import "@openzeppelin/contracts/access/roles/MinterRole.sol";
import "@openzeppelin/contracts/ownership/Ownable.sol";
import "./IERC20WCC.sol";

/**
 * @notice An ERC that will represent deposited coffee to a validator.
 * @dev When deploying the contract the deployer should renounce the minter role after it has added the TokenHandler as minter.
 */

contract WrappedCoffeeCoin is ERC20, ERC20Detailed, Ownable, MinterRole {
  event LogSetCoffeeHandler(address indexed _owner, address _contract);

  string private ipfsHash;
  address public coffeeHandler;

  constructor() ERC20Detailed("Wrapped Coffee Coin", "WCC", 18) public {}

  function setCoffeeHandler(address _coffeeHandler) public onlyOwner{
    addMinter(_coffeeHandler);
    coffeeHandler = _coffeeHandler;
    renounceMinter();
    emit LogSetCoffeeHandler(msg.sender, _coffeeHandler);
  }

  /**
    * @notice Called when a minter wants to create new tokens.
    * @dev See `ERC20._mint`.
    *
    * Requirements:
    *
    * - the caller must have the `MinterRole`.
    *  TODO:  Farmer must approve mint before minting
    */
  function mint(address account, uint256 amount) public onlyMinter returns (bool) {
    require(coffeeHandler != address(0), "Coffee Handler must be set");
    _mint(account, amount);
    return true;
  }

  function burn(address account, uint256 amount) public onlyMinter returns (bool) {
    require(coffeeHandler != address(0), "Coffee Handler must be set");
    _burn(account, amount);
    return true;
  }

  /**
    * @notice Returns the hash pointer to the file containing the details about the coffee this token represents.
    *
    */
  function getCoffee() public view returns(string memory) {
    return ipfsHash;
  }

  /**
    * @notice Updates the IPFS pointer for the information about this coffee.
    * 
    */
  function updateCoffee(string memory _ipfs) public onlyOwner {
    require(bytes(_ipfs).length != 0, "The IPFS pointer cannot be empty.");
    ipfsHash = _ipfs;
  }
}
