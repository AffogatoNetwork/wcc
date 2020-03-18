/** @title Coffee Handler
  * @author Affogato
  * @dev Right now only owner can mint and stake
  */
pragma solidity ^0.5.5;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";
import "@openzeppelin/contracts/ownership/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

//Testing
import "@nomiclabs/buidler/console.sol";

contract BondingToken is ERC20, ERC20Detailed, Ownable {

  /** @dev Logs all the calls of the functions. */
  event LogUpdateCoffee(address indexed _owner, string _ipfsHash);
  event LogBuyToken(address indexed _owner, uint _value);
  event LogBurnToken(address indexed _owner, uint _amount, uint _value);

  using SafeMath for uint256;

  uint public maximumValue; // Maximum value  / 2
  uint public midValue; // Maximum value  / 2
  uint public inflectionPoint; // inflection point
  uint public steppeness ; // curve steppeness
  uint public initialValue; // Inital curve value
  uint public etherPrice;

  uint public poolBalance;
  uint public maximumMint;

  /** @notice an ipfs hash of the json with the coffee information */
  string private ipfsHash;

  /** @notice Initializes the ERC20 Details*/
  constructor(
    string memory name,
    string memory symbol,
    uint8 decimals,
    uint _maximumValue,
    uint _inflectionPoint,
    uint _steppeness,
    uint _initialValue,
    uint _maximumMint,
    uint _etherPrice
  ) ERC20Detailed(name, symbol, decimals) public {
    maximumValue = _maximumValue;
    midValue = maximumValue/2; // Maximum value  / 2
    inflectionPoint = _inflectionPoint; // inflection point
    steppeness = _steppeness; // curve steppeness
    initialValue = _initialValue; // Inital curve value
    maximumMint = _maximumMint;
    etherPrice = _etherPrice;
    poolBalance = 0;
  }

  function sqrt(uint x) internal pure returns (uint y){
    //multiplied for decimal precision
    uint tempX = x * 10000;
    uint z = (tempX + 1)/2;
    y = tempX;
    while (z < y) {
      y = z;
      z = (tempX / z + z) / 2;
    }
    y = y / 100; // divided for decimal precision
  }

  function _tokenPrice(uint x) private view returns (uint y){
    if(x <= inflectionPoint){
      y = initialValue;
    }else{
      //error
      uint top = midValue.mul(x.sub(inflectionPoint).mul(100));
      uint bottom = sqrt(steppeness.add(x.sub(inflectionPoint).mul(x.sub(inflectionPoint))));
      y = top.div(bottom).div(100).add(midValue).add(initialValue);
      // y = ((midValue*(((x-inflectionPoint)*100) / sqrt(steppeness + ((x-inflectionPoint)*(x-inflectionPoint)))))/100) + midValue + initialValue;
    }
  }

  function tokenPrice(uint x) public view returns (uint y){
    y = _tokenPrice(x).mul(etherPrice);
  }

  function buyToken() public payable {
    require(totalSupply().add(1) <= maximumMint, "Can't mint more tokens");
    uint mintedTokens = totalSupply() + 1;
    require(tokenPrice(mintedTokens) == msg.value, "Not enought payment");
    poolBalance = poolBalance.add(tokenPrice(mintedTokens));
    _mint(msg.sender, 1);
    emit LogBuyToken(msg.sender, msg.value);
  }

  function burnToken() public {
    require(balanceOf(msg.sender) >= 1, "Not enough tokens to burn");
   //burn token
    uint amount = tokenPrice(totalSupply());
    poolBalance = poolBalance.sub(amount);
    _burn(msg.sender, 1);
    /* solium-disable-next-line */
    (bool success, ) = msg.sender.call.value(amount)("");
    require(success, "Transfer failed.");
    emit LogBurnToken(msg.sender, 1, amount);
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
