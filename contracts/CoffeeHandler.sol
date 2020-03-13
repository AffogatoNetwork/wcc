/** @title Coffee Handler
  * @author Affogato
  * @dev Right now only owner can mint and stake
  */
pragma solidity ^0.5.5;

import "@openzeppelin/contracts/ownership/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./IERC20WCC.sol";

contract CoffeeHandler is Ownable {

  /** @dev Logs all the calls of the functions. */
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

  /** @notice address of the WCC Contract used to mint
    * @dev The WCC Contract must have set the coffee handler
    */
  IERC20WCC public WCC_CONTRACT;

  /** @notice address of the DAI Contract used to stake */
  IERC20 public DAI_CONTRACT;

  /** @notice coffee price rounded */
  uint public COFFEE_PRICE;

  /** @notice percentage value with no decimals */
  uint public STAKE_RATE;

  /** @notice mapping of the stake of a validator */
  mapping (address => uint) public userToStake;

  /** @notice mapping of the stake used in a mint */
  mapping (address => uint) public tokensUsed;

  /** @notice mapping of the approval done by an user to a validator */
  mapping (address => mapping (address => uint)) public tokensMintApproved;

  /** @notice mapping of which validator minted a token for a user
    * @dev this is used to see to which validator return the stake
    */
  mapping (address => address) public userToValidator;

  /** @notice date of when the contract was deployed */
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
    * @param _amount uint with the stake
    * @dev Requires users to approve first in the ERC20
    */
  function stakeDAI(uint _amount) public onlyNotPaused onlyOwner {
    require(DAI_CONTRACT.balanceOf(msg.sender) >= _amount, "Not enough balance");
    require(DAI_CONTRACT.allowance(msg.sender, address(this)) >= _amount, "Contract allowance is to low or not approved");
    userToStake[msg.sender] = userToStake[msg.sender].add(_amount);
    DAI_CONTRACT.transferFrom(msg.sender, address(this), _amount);
    emit LogStakeDAI(msg.sender, _amount, userToStake[msg.sender]);
  }

  /** @notice Allows a user to remove the current available staked ERC20
    * @param _amount uint with the stake to remove
    */
  function _removeStakedDAI(uint _amount) private {
    require(userToStake[msg.sender] >= _amount, "Amount bigger than current available to retrive");
    userToStake[msg.sender] = userToStake[msg.sender].sub(_amount);
    DAI_CONTRACT.transfer(msg.sender, _amount);
  }

  /** @notice Allows a user to remove certain amount of the current available staked ERC20
    * @param _amount uint with the stake to remove
    */
  function removeStakedDAI(uint _amount) public {
    _removeStakedDAI(_amount);
    emit LogRemoveStakedDAI(msg.sender, _amount, userToStake[msg.sender]);
  }

  /** @notice Allows a user to remove all the available staked ERC20 */
  function removeAllStakedDAI() public {
    uint amount = userToStake[msg.sender];
    _removeStakedDAI(amount);
    emit LogRemoveAllStakedDAI(msg.sender, amount, userToStake[msg.sender]);
  }

  /** @notice Allows a validator that has staked ERC20 to mint tokens and assign them to a receiver
    * @param _receiver address of the account that will receive the tokens
    * @param _amount uint with the amount in wei to mint
    * @dev Requires receiver to approve first, it moves the staked ERC20 to another mapping to prove that the stake is being used and unable to retreive.
    */
  function mintTokens(address _receiver, uint _amount) public onlyOwner {
    require(tokensMintApproved[_receiver][msg.sender] >= _amount, "Mint value bigger than approved by user");
    uint expectedAvailable = requiredAmount(_amount);
    require(userToStake[msg.sender] >= expectedAvailable, "Not enough DAI Staked");
    userToStake[msg.sender] = userToStake[msg.sender].sub(expectedAvailable);
    tokensUsed[msg.sender] = tokensUsed[msg.sender].add(_amount);
    tokensMintApproved[_receiver][msg.sender] = 0;
    userToValidator[_receiver] = msg.sender;
    WCC_CONTRACT.mint(_receiver, _amount);
    emit LogMintTokens(msg.sender, _receiver, _amount, tokensUsed[msg.sender]);
  }

  /** @notice Allows an user to burn their tokens and release the used stake for the validator
    * @param _amount uint with the amount in wei to burn
    * @dev This function should be called only when there is a redeem of physical coffee
    */
  function burnTokens(uint _amount) public {
    uint expectedAvailable = requiredAmount(_amount);
    address validator = userToValidator[msg.sender];
    require(tokensUsed[validator] >= _amount, "Burn amount higher than stake minted");
    userToStake[validator] = userToStake[validator].add(expectedAvailable);
    tokensUsed[validator] = tokensUsed[validator].sub(_amount);
    WCC_CONTRACT.burn(msg.sender, _amount);
    emit LogBurnTokens(validator, msg.sender, _amount, tokensUsed[validator]);
  }

  /** @notice Calculate the amount of stake needed to mint an amount of tokens.
    * @param _amount uint with the amount in wei
    * @return the amount of stake needed
    * @dev (AMOUNT X COFFEE_PRICE X STAKE RATE) / 100
    */
  function requiredAmount(uint _amount) public view returns(uint) {
    return _amount.mul(COFFEE_PRICE.mul(STAKE_RATE)).div(100);
  }

  /** @notice Approves a validator to mint certain amount of tokens and receive them
    * @param _validator address of the validator
    * @param _amount uint with the amount in wei
    */
  function approveMint(address _validator, uint _amount) public {
    tokensMintApproved[msg.sender][_validator] = _amount;
    emit LogApproveMint(msg.sender, _validator, _amount);
  }

  /** @notice Allows token holders to change their tokens for DAI after 3 months
    * @param _amount uint with the amount in wei to redeem
    */
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

  /** @notice After 6 months it allows the deployer to retrieve all DAI locked in contract.
    * @dev safeguard for when the pilot ends
    */
  function liquidateStakedDAI() public onlyOwner {
    /* solium-disable-next-line */
    require(now >= openingTime + 90 days, "only available after 6 months of deployment");
    uint amount = DAI_CONTRACT.balanceOf(address(this));
    DAI_CONTRACT.transfer(owner(), amount);
    emit LogLiquidateStakedDAI(msg.sender, amount);
  }
}
