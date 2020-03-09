/** @title Coffee Handler
  * @author Affogato
  * @dev Right now only owner can mint and stake
  */
pragma solidity ^0.5.11;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";
import "@openzeppelin/contracts/ownership/Ownable.sol";

contract BondingToken is ERC20, ERC20Detailed, Ownable {

  /** @dev Logs all the calls of the functions. */
  event LogUpdateCoffee(address indexed _owner, string _ipfsHash);

  uint a = 5; // Maximum value  / 2
  uint b = 5; // inflection point
  uint c = 75; // curve steppeness
  uint k = 10; // Inital curve value

  uint public poolBalance = 0;
  uint public maxMint = 30;
  uint public mintedTokens = 0;

  mapping(address => uint) public tokenBalance;

  /** @notice an ipfs hash of the json with the coffee information */
  string private ipfsHash;

  /** @notice Initializes the ERC20 Details*/
  constructor(
    string memory name,
    string memory symbol,
    uint8 decimals) ERC20Detailed(name, symbol, decimals) public {
  }

  function sqrt(uint x) internal pure returns (uint y){
    //multiplied for decimal precision
    uint tempX = x * 10000;
    uint z = (tempX + 1) / 2;
    y = tempX;
    while (z < y) {
      y = z;
      z = (x / z + z) / 2;
    }
    y = y / 100; // divided for decimal precision
  }

  function tokenPrice (uint x) public view returns (uint y){
    if(x < b){
      y = k;
    }else{
      y = ((a*(((x-b)*100) / sqrt(c + ((x-b)*(x-b)))))/100) + a + k;
    }
  }

  function buyToken() public payable {
    require(mintedTokens <= maxMint, "Can't mint more tokens");
    mintedTokens++;
    require(tokenPrice(mintedTokens) * 1 ether == msg.value, "Not enought payment");
    poolBalance = poolBalance + tokenPrice(mintedTokens);
    tokenBalance[msg.sender] = tokenBalance[msg.sender] + 1;
  }

  function burnToken() public {
    require(tokenBalance[msg.sender] >= 1, "Not enough tokens to burn");
    tokenBalance[msg.sender] = tokenBalance[msg.sender] - 1;
    mintedTokens--;
    poolBalance = poolBalance - tokenPrice(mintedTokens);
    /* solium-disable-next-line */
    (bool success, ) = msg.sender.call.value(tokenPrice(mintedTokens) * 1 ether)("");
    require(success, "Transfer failed.");
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
