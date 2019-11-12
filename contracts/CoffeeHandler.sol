pragma solidity ^0.5.11;

import "@openzeppelin/contracts/ownership/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./IERC20WCC.sol";

contract CoffeeHandler is Ownable {

  event LogSetDAIContract(address indexed _owner, IERC20 _contract);
  event LogSetWCCContract(address indexed _owner, IERC20WCC _contract);
  event LogSetCoffeePrice(address indexed _owner, uint _coffeePrice);
  event LogSetStakeRate(address indexed _owner, uint _stakeRate);
  event LogStakeDAI(address indexed _staker, uint _amount, uint _currentStake);
  event LogRemoveStakedDAI(address indexed _staker, uint _amount, uint _currentStake);
  event LogMintTokens(address indexed _staker, uint _amount, uint _currentUsed);

  using SafeMath for uint256;
  IERC20WCC public WCC_CONTRACT;
  IERC20 public DAI_CONTRACT;
  uint public COFFEE_PRICE; /** @dev *coffee price rounded */
  uint public STAKE_RATE; /** @dev percentage value  */
  mapping (address => uint) public userToStake;
  mapping (address => uint) public tokensUsed;

  function setDAIContract(IERC20 _DAI_CONTRACT) public onlyOwner{
    DAI_CONTRACT = _DAI_CONTRACT;
    emit LogSetDAIContract(msg.sender, _DAI_CONTRACT);
  }

  function setWCCContract(IERC20WCC _WCC_CONTRACT) public onlyOwner{
    WCC_CONTRACT = _WCC_CONTRACT;
    emit LogSetWCCContract(msg.sender, _WCC_CONTRACT);
  }

  function setCoffeePrice(uint _COFFEE_PRICE) public onlyOwner{
    COFFEE_PRICE = _COFFEE_PRICE;
    emit LogSetCoffeePrice(msg.sender, _COFFEE_PRICE);
  }

  function setStakeRate(uint _STAKE_RATE) public onlyOwner{
    STAKE_RATE = _STAKE_RATE;
    emit LogSetStakeRate(msg.sender, _STAKE_RATE);
  }

  function stakeDAI(uint _amount) public {
    require(DAI_CONTRACT.balanceOf(msg.sender) >= _amount, "Not enough balance");
    require(DAI_CONTRACT.allowance(msg.sender, address(this)) >= _amount, "Contract allowance is to low or not approved");
    DAI_CONTRACT.transferFrom(msg.sender, address(this), _amount);
    userToStake[msg.sender] = userToStake[msg.sender].add(_amount);
    emit LogStakeDAI(msg.sender, _amount, userToStake[msg.sender]);
  }

  function removeStakedDAI(uint _amount) public {
    require(userToStake[msg.sender] >= _amount, "Amount bigger than current available to retrive");
    userToStake[msg.sender] = userToStake[msg.sender].sub(_amount);
    DAI_CONTRACT.transfer(msg.sender, _amount);
    emit LogRemoveStakedDAI(msg.sender, _amount, userToStake[msg.sender]);
  }

  function mintTokens(uint _amount) public {
    uint expectedAvailable = requiredAmount(_amount);
    require(userToStake[msg.sender] >= expectedAvailable, "Not enough DAI Staked");
    userToStake[msg.sender] = userToStake[msg.sender].sub(expectedAvailable);
    tokensUsed[msg.sender] = tokensUsed[msg.sender].add(_amount);
    WCC_CONTRACT.mint(msg.sender, _amount);
    emit LogMintTokens(msg.sender, _amount, tokensUsed[msg.sender]);
  }

  function requiredAmount(uint _amount) public view returns(uint){
    return _amount.mul(COFFEE_PRICE.mul(STAKE_RATE)).div(100);
  }

    //Allow to mint token
    //Allow to burn token
}
