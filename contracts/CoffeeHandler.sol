pragma solidity ^0.5.12;
import "@openzeppelin/contracts/ownership/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract CoffeeHandler is Ownable {

    event LogSetDAIContract(address indexed _owner, IERC20 _contract);
    event LogSetWCCContract(address indexed _owner, IERC20 _contract);
	 event LogSetCoffeePrice(address indexed _owner, uint _coffeePrice);
	 event LogStakeDAI(address indexed _staker, uint _amount, uint _currentStake);
	 event LogRemoveStakedDAI(address indexed _staker, uint _amount, uint _currentStake);

    using SafeMath for uint256;
    IERC20 public WCC_CONTRACT;
    IERC20 public DAI_CONTRACT;
	 uint public COFFEE_PRICE;
	 mapping (address => uint) public userToStake;

    function setDAIContract(IERC20 _DAI_CONTRACT) public onlyOwner{
      DAI_CONTRACT = _DAI_CONTRACT;
      emit LogSetDAIContract(msg.sender, _DAI_CONTRACT);
    }

    function setWCCContract(IERC20 _WCC_CONTRACT) public onlyOwner{
      WCC_CONTRACT = _WCC_CONTRACT;
      emit LogSetWCCContract(msg.sender, _WCC_CONTRACT);
    }

	 function setCoffeePrice(uint _COFFEE_PRICE) public onlyOwner{
      COFFEE_PRICE = _COFFEE_PRICE;
      emit LogSetCoffeePrice(msg.sender, _COFFEE_PRICE);
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

    //Allow to mint token
    //Allow to burn token

}
