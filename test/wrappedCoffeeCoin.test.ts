import { ethers } from "@nomiclabs/buidler";
import { deployContract, getWallets, solidity } from "ethereum-waffle";
import WrappedCoffeeCoinArtifact from "../build/WrappedCoffeeCoin.json";
import { WrappedCoffeeCoin } from "../typechain/WrappedCoffeeCoin";
import chai from "chai";

chai.use(solidity);
const { expect } = chai;
require("chai").should();

describe("WrappedCoffeeCoin", () => {
	describe("ERC20 Validations", () => {
		const provider = ethers.provider;
		let accounts = getWallets(provider);
		let wrappedCoffeeCoin: WrappedCoffeeCoin;

		before(async () => {
			//@ts-ignore
			wrappedCoffeeCoin = (await deployContract(
				accounts[0],
				WrappedCoffeeCoinArtifact
			)) as WrappedCoffeeCoin;
			expect(wrappedCoffeeCoin.address).to.properAddress;
		});

		it("...should set the token details", async () => {
			let name = await wrappedCoffeeCoin.name();
			let symbol = await wrappedCoffeeCoin.symbol();
			let decimals = await wrappedCoffeeCoin.decimals();
			name.should.be.equal("Wrapped Coffee Coin");
			symbol.should.be.equal("WCC");
			decimals.should.be.equal(0);
		});

		// it("...should validate permissions", async () => {
		//   let isException = false;
		//   try {
		//     await this.tokenInstance.wrapCoffee(accounts[0], 1, {
		//       from: accounts[0]
		//     });
		//   } catch (err) {yartn
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
