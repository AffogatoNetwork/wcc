require("chai").should();
require("chai").expect;
//Zeppeling helpers
//@ts-ignore
const { BN, constants, balance, expectEvent, expectRevert } = require("@openzeppelin/test-helpers");

var WrappedCoffeeCoin = artifacts.require("WrappedCoffeeCoin");

contract("WrappedCoffeeCoin", accounts => {
  describe("ERC20 Validations", () => {
    it("...should set the token details", async () => {
      const wrappedCoffeeCoin = await WrappedCoffeeCoin.new({ from: accounts[0] });
      let name = await wrappedCoffeeCoin.name();
      let symbol = await wrappedCoffeeCoin.symbol();
      let decimals = await wrappedCoffeeCoin.decimals();
      name.should.be.equal("Wrapped Coffee Coin");
      symbol.should.be.equal("WCC");
      decimals.toNumber().should.be.equal(0);
    });

    // it("...should validate permissions", async () => {
    //   let isException = false;
    //   try {
    //     await this.tokenInstance.wrapCoffee(accounts[0], 1, {
    //       from: accounts[0]
    //     });
    //   } catch (err) {
    //     isException = true;
    //     assert(err.reason === "caller must be holder contract");
    //   }
    //   isException.should.equal(true, "should rever on not a holder account");
    //   isException = false;
    //   try {
    //     await this.tokenInstance.unwrapCoffee(accounts[0], 1, {
    //       from: accounts[0]
    //     });
    //   } catch (err) {
    //     isException = true;
    //     assert(err.reason === "caller must be holder contract");
    //   }
    //   isException.should.equal(true, "should rever on not a holder account");
    // });
  });
});
