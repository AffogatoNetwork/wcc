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
  event LogMintTokens(address indexed _staker, address owner, uint _amount, uint _currentUsed);
  event LogBurnTokens(address indexed _staker, address owner, uint _amount, uint _currentUsed);
  event LogApproveMint(address indexed _owner, address _staker, uint amount);
  event LogRedeemTokens(address indexed _staker, address owner, uint _amount, uint _currentUsed);

  using SafeMath for uint256;
  IERC20WCC public WCC_CONTRACT;
  IERC20 public DAI_CONTRACT;
  uint public COFFEE_PRICE; /** @dev *coffee price rounded */
  uint public STAKE_RATE; /** @dev percentage value  */
  mapping (address => uint) public userToStake;
  mapping (address => uint) public tokensUsed;
  mapping (address => mapping (address => uint)) public tokensMintApproved;
  mapping (address => address) public userToValidator;
  uint256 public openingTime;

  constructor() public {
    /* solium-disable-next-line */
    openingTime = now;
  }

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

  function mintTokens(address _owner, uint _amount) public {
    require(tokensMintApproved[_owner][msg.sender] >= _amount, "Mint value bigger than approved by user");
    uint expectedAvailable = requiredAmount(_amount);
    require(userToStake[msg.sender] >= expectedAvailable, "Not enough DAI Staked");
    userToStake[msg.sender] = userToStake[msg.sender].sub(expectedAvailable);
    tokensUsed[msg.sender] = tokensUsed[msg.sender].add(_amount);
    tokensMintApproved[_owner][msg.sender] = 0;
    userToValidator[_owner] = msg.sender;
    WCC_CONTRACT.mint(_owner, _amount);
    emit LogMintTokens(msg.sender, _owner, _amount, tokensUsed[msg.sender]);
  }

  function burnTokens(uint _amount) public {
    uint expectedAvailable = requiredAmount(_amount);
    address validator = userToValidator[msg.sender];
    require(tokensUsed[validator] >= _amount, "Burn amount higher than stake minted");
    userToStake[validator] = userToStake[validator].add(expectedAvailable);
    tokensUsed[validator] = tokensUsed[validator].sub(_amount);
    WCC_CONTRACT.burn(msg.sender, _amount);
    emit LogBurnTokens(validator, msg.sender, _amount, tokensUsed[validator]);
  }

  function requiredAmount(uint _amount) public view returns(uint) {
    return _amount.mul(COFFEE_PRICE.mul(STAKE_RATE)).div(100);
  }

  function approveMint(address _validator, uint _amount) public {
    tokensMintApproved[msg.sender][_validator] = _amount;
    emit LogApproveMint(msg.sender, _validator, _amount);
  }

  function redeemTokens(uint _amount) public {
    /* solium-disable-next-line */
    require(now >= openingTime + 90 days, "Redeem is only available after 3 months of deployment");
    uint expectedAvailable = requiredAmount(_amount);
    address validator = userToValidator[msg.sender];
    require(tokensUsed[validator] >= _amount, "Redeem amount is higher than redeemable amount");
    uint tokenToDai = COFFEE_PRICE.mul(_amount);
    userToStake[validator] = userToStake[validator].add(expectedAvailable).sub(tokenToDai);
    tokensUsed[validator] = tokensUsed[validator].sub(_amount);
    WCC_CONTRACT.burn(msg.sender, _amount);
    DAI_CONTRACT.transfer(msg.sender, tokenToDai);
    emit LogRedeemTokens(validator, msg.sender, _amount, tokensUsed[validator]);
  }
  //expire tokens
}
