pragma solidity ^0.5.12;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";
import "@openzeppelin/contracts/access/roles/MinterRole.sol";
import "@openzeppelin/contracts/ownership/Ownable.sol";

/**
 * @notice An ERC that will represent deposited coffee to a validator.
 * @dev When deploying the contract the deployer should renounce the minter role after it has added the TokenHandler as minter.
 */

contract WrappedCoffeeCoin is ERC20, ERC20Detailed, Ownable, MinterRole {

    string private ipfsHash;

    constructor(address _tokenHandler) ERC20Detailed("Wrapped Coffee Coin", "WCC", 0) public {
        require(_tokenHandler != address(0x0), "Cannot add the 0x0 address as minter");
        addMinter(_tokenHandler);
        renounceMinter();
    }

    /** 
     * @notice Called when a minter wants to create new tokens.
     * @dev See `ERC20._mint`.
     *
     * Requirements:
     *
     * - the caller must have the `MinterRole`.
     */
    function mint(address account, uint256 amount) public onlyMinter returns (bool) {
        _mint(account, amount);
        return true;
    }

    /**
     * @notice Returns the hash pointer to the file containing the details about the coffee this token represents.
     *
     */
    function getCoffee() public returns(string memory) {
        return ipfsHash;
    }

    /**
     * @notice Updates the IPFS pointer for the information about this coffee.
     *
     */
     function updateCoffee(string memory _ipfs) public onlyMinter {
         require(bytes(_ipfs).length != 0, "The IPFS pointer cannot be empty.");
         ipfsHash = _ipfs;
     }
}
