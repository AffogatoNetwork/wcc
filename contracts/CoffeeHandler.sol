/** @title Actor Factory.
 *  @author Affogato
 */
pragma solidity ^0.5.11;

import "@openzeppelin/contracts/ownership/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./IERC20WCC.sol";

contract CoffeeHandler is Ownable {

  /** @dev Logs all the actions of the functions. */
  event LogSetDAIContract(address indexed _owner, IERC20 _contract);
  event LogSetWCCContract(address indexed _owner, IERC20WCC _contract);
  event LogSetCoffeePrice(address indexed _owner, uint _coffeePrice);
  event LogSetStakeRate(address indexed _owner, uint _stakeRate);
  event LogStakeDAI(address indexed _staker, uint _amount, uint _currentStake);
  event LogRemoveStakedDAI(address indexed _staker, uint _amount, uint _currentStake);
  event LogRemoveAllStakedDAI(address indexed _staker, uint _amount, uint _currentStake);
  event LogMintTokens(address indexed _staker, address owner, uint _amount, uint _currentUsed);
  event LogBurnTokens(address indexed _staker, address owner, uint _amount, uint _currentUsed);
  event LogApproveMint(address indexed _owner, address _staker, uint amount);
  event LogRedeemTokens(address indexed _staker, address owner, uint _amount, uint _currentUsed);
  event LogLiquidateStakedDAI(address indexed _owner, uint _amount);

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

  /** @notice Throws if the function called is after 3 months
    * @dev This is temporal for pilot it should be variable depending on coffee
    */
  modifier onlyPaused() {
    /* solium-disable-next-line */
    require(now >= openingTime + 90 days, "only available after 3 months of deployment");
    _;
  }

  /** @notice Throws if the function called is before 3 months
    * @dev This is temporal for pilot it should be variable depending on coffee
    */
  modifier onlyNotPaused() {
    /* solium-disable-next-line */
    require(now <= openingTime + 90 days, "only available during the 3 months of deployment");
    _;
  }
  /** @notice Constructor sets the starting time
    * @dev opening time is only relevant for pilot
    */
  constructor() public {
    /* solium-disable-next-line */
    openingTime = now;
  }

  /** @notice Sets the DAI Contract, Only deployer can change it
    * @param _DAI_CONTRACT address of ERC-20 used as stake
    */
  function setDAIContract(IERC20 _DAI_CONTRACT) public onlyOwner {
    DAI_CONTRACT = _DAI_CONTRACT;
    emit LogSetDAIContract(msg.sender, _DAI_CONTRACT);
  }

  /** @notice Sets the Wrapped Coffee Coin Contract, Only deployer can change it
    * @param _WCC_CONTRACT address of ERC-20 used as stake
    */
  function setWCCContract(IERC20WCC _WCC_CONTRACT) public onlyOwner {
    WCC_CONTRACT = _WCC_CONTRACT;
    emit LogSetWCCContract(msg.sender, _WCC_CONTRACT);
  }

  /** @notice Sets the price of the coffee, Only deployer can change it
    * @param _COFFEE_PRICE uint with the coffee price
    * @dev this function should be called by an oracle after pilot
    */
  function setCoffeePrice(uint _COFFEE_PRICE) public onlyOwner {
    COFFEE_PRICE = _COFFEE_PRICE;
    emit LogSetCoffeePrice(msg.sender, _COFFEE_PRICE);
  }

  /** @notice Sets the stake rate needed for minting tokens, only deployer can change it
    * @param _STAKE_RATE uint with the rate to stake
    */
  function setStakeRate(uint _STAKE_RATE) public onlyOwner{
    STAKE_RATE = _STAKE_RATE;
    emit LogSetStakeRate(msg.sender, _STAKE_RATE);
  }

  /** @notice Allows a user to stake ERC20
    * @param _amount uint with the rate to stake
    * @dev Requires users to approve first in the ERC20
    */
  function stakeDAI(uint _amount) public onlyNotPaused {
    require(DAI_CONTRACT.balanceOf(msg.sender) >= _amount, "Not enough balance");
    require(DAI_CONTRACT.allowance(msg.sender, address(this)) >= _amount, "Contract allowance is to low or not approved");
    userToStake[msg.sender] = userToStake[msg.sender].add(_amount);
    DAI_CONTRACT.transferFrom(msg.sender, address(this), _amount);
    emit LogStakeDAI(msg.sender, _amount, userToStake[msg.sender]);
  }

  /** @notice Allows a user to remove the current available staked ERC20, DA
    * @param _amount uint with the rate to stake
    * @dev Requires users to approve first in the ERC20
    */
  function _removeStakedDAI(uint _amount) private {
    require(userToStake[msg.sender] >= _amount, "Amount bigger than current available to retrive");
    userToStake[msg.sender] = userToStake[msg.sender].sub(_amount);
    DAI_CONTRACT.transfer(msg.sender, _amount);
  }

  function removeStakedDAI(uint _amount) public {
    _removeStakedDAI(_amount);
    emit LogRemoveStakedDAI(msg.sender, _amount, userToStake[msg.sender]);
  }

  function removeAllStakedDAI() public {
    uint amount = userToStake[msg.sender];
    _removeStakedDAI(amount);
    emit LogRemoveAllStakedDAI(msg.sender, amount, userToStake[msg.sender]);
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

  function redeemTokens(uint _amount) public onlyPaused {
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

  function liquidateStakedDAI() public onlyOwner {
    /* solium-disable-next-line */
    require(now >= openingTime + 90 days, "only available after 6 months of deployment");
    uint amount = DAI_CONTRACT.balanceOf(address(this));
    DAI_CONTRACT.transfer(owner(), amount);
    emit LogLiquidateStakedDAI(msg.sender, amount);
  }
}
