require("chai").should();
require("chai").expect;

//Zeppeling helpers

//@ts-ignore
const { BN, constants, balance, expectEvent, expectRevert } = require("@openzeppelin/test-helpers");

var CoffeeHandler = artifacts.require("CoffeeHandler");

contract("CoffeeHandler", (accounts: any) => {
  describe("Coffee Handler Validations", () => {
    const DAI_CONTRACT = "0xC4375B7De8af5a38a93548eb8453a498222C4fF2";
    const WCC_CONTRACT = "0x1655a4c1fa32139ac1de4ca0015fc22429933115";

    it("...should set the DAI contract", async () => {
      const coffeeHandler = await CoffeeHandler.new({ from: accounts[0] });
      let currentDAIContract = await coffeeHandler.DAI_CONTRACT();
      currentDAIContract.should.be.equal(constants.ZERO_ADDRESS);
      await expectRevert(
        coffeeHandler.setDAIContract(DAI_CONTRACT, { from: accounts[1] }),
        "Ownable: caller is not the owner"
      );
      const receipt = await coffeeHandler.setDAIContract(DAI_CONTRACT, {
        from: accounts[0]
      });
      expectEvent(receipt, "LogSetDAIContract", {
        _owner: accounts[0],
        _contract: DAI_CONTRACT
      });
      currentDAIContract = await coffeeHandler.DAI_CONTRACT();
      currentDAIContract.should.be.equal(DAI_CONTRACT, "DAI Contract must be updated");
    });

    it("...should set the WCC contract", async () => {
      const coffeeHandler = await CoffeeHandler.new({ from: accounts[0] });
      let currentWCCContract = await coffeeHandler.WCC_CONTRACT();
      currentWCCContract.should.be.equal(constants.ZERO_ADDRESS);
      await expectRevert(
        coffeeHandler.setWCCContract(WCC_CONTRACT, { from: accounts[1] }),
        "Ownable: caller is not the owner"
      );
      const receipt = await coffeeHandler.setWCCContract(WCC_CONTRACT, {
        from: accounts[0]
      });
      expectEvent(receipt, "LogSetWCCContract", {
        _owner: accounts[0],
        _contract: WCC_CONTRACT
      });
      currentWCCContract = await coffeeHandler.WCC_CONTRACT();
      currentWCCContract.should.be.equal(WCC_CONTRACT, "WCC Contract must be updated");
    });
  });
});
