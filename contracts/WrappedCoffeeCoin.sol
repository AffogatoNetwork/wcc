/** @title Wrapped Coffee Coin
  * @author Affogato
  * @notice An ERC that will represent deposited coffee to a validator having DAI staked as collateral.
  * @dev When deploying the contract the deployer needs to specify the coffee handler and renounce as minter.
  * @dev this is a pilot contract
  */
pragma solidity ^0.5.11;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";
import "@openzeppelin/contracts/access/roles/MinterRole.sol";
import "@openzeppelin/contracts/ownership/Ownable.sol";

contract WrappedCoffeeCoin is ERC20, ERC20Detailed, Ownable, MinterRole {

  /** @dev Logs all the calls of the functions. */
  event LogSetCoffeeHandler(address indexed _owner, address _contract);
  event LogUpdateCoffee(address indexed _owner, string _ipfsHash);

  /** @notice an ipfs hash of the json with the coffee information */
  string private ipfsHash;
  /** @notice address of the coffee handler contract */
  address public coffeeHandler;

  /** @notice Initializes the ERC20 Details*/
  constructor() ERC20Detailed("Single Coffee Token", "CAFE", 18) public {}

  /** @notice Sets the coffee handler
    * @param _coffeeHandler address of the coffee handler contract allowed to mint tokens
    * @dev owner renounces as minter, it's not done in constructor due to a bug
    */
  function setCoffeeHandler(address _coffeeHandler) public onlyOwner{
    addMinter(_coffeeHandler);
    coffeeHandler = _coffeeHandler;
    renounceMinter();
    emit LogSetCoffeeHandler(msg.sender, _coffeeHandler);
  }

  /** @notice Called when a minter wants to create new tokens
    * @param _account account to be assigned the minted tokens
    * @param _amount amount of tokens to be minted
    * @dev See `ERC20._mint`, coffee handler address must be set before minting
    */
  function mint(address _account, uint256 _amount) public onlyMinter returns (bool) {
    require(coffeeHandler != address(0), "Coffee Handler must be set");
    _mint(_account, _amount);
    return true;
  }

  /** @notice Called when a minter wants to burn the tokens
    * @param _account account to be assigned the burned tokens
    * @param _amount amount of tokens to be burned
    * @dev See `ERC20._mint`.  coffee handler address must be set before minting
    */
  function burn(address _account, uint256 _amount) public onlyMinter returns (bool) {
    require(coffeeHandler != address(0), "Coffee Handler must be set");
    _burn(_account, _amount);
    return true;
  }

  /** @notice Returns the hash pointer to the file containing the details about the coffee this token represents.
    * @return string with the ipsh hash pointing to a json with the coffee information
    */
  function getCoffee() public view returns(string memory) {
    return ipfsHash;
  }

  /** @notice Updates the IPFS pointer for the information about this coffee.
    * @param _ipfs ipfs hash
    */
  function updateCoffee(string memory _ipfs) public onlyOwner {
    require(bytes(_ipfs).length != 0, "The IPFS pointer cannot be empty");
    ipfsHash = _ipfs;
    emit LogUpdateCoffee(msg.sender, ipfsHash);
  }
}
