pragma solidity ^0.5.12;
import "@openzeppelin/contracts/ownership/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract CoffeeHandler is Ownable {

    event LogSetDAIContract(address indexed _owner, IERC20 _contract);
    event LogSetWCCContract(address indexed _owner, IERC20 _contract);

    using SafeMath for uint256;
    IERC20 public WCC_CONTRACT;
    IERC20 public DAI_CONTRACT;

    function setDAIContract(IERC20 _DAI_CONTRACT) public onlyOwner{
      DAI_CONTRACT = _DAI_CONTRACT;
      emit LogSetDAIContract(msg.sender, _DAI_CONTRACT);
    }

    function setWCCContract(IERC20 _WCC_CONTRACT) public onlyOwner{
      WCC_CONTRACT = _WCC_CONTRACT;
      emit LogSetWCCContract(msg.sender, _WCC_CONTRACT);
    }

    //Allow to mint token
    //Allow to burn token
    //Stake DAI

}
