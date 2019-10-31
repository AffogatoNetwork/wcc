require("chai").should();
require("chai").expect;

//Zeppeling helpers

//@ts-ignore
const { BN, constants, balance, expectEvent, expectRevert } = require("@openzeppelin/test-helpers");
var CoffeeHandler = artifacts.require("CoffeeHandler");
var DaiToken = artifacts.require("DaiToken");

contract("CoffeeHandler", accounts => {
	describe("Coffee Handler Validations", () => {
		let DAI_CONTRACT = constants.ZERO_ADDRESS;
		const WCC_CONTRACT = "0x1655a4C1FA32139AC1dE4cA0015Fc22429933115";

		before(async () => {
			let daiToken = await DaiToken.deployed();
			DAI_CONTRACT = daiToken.address;
		});

		it("...should set the DAI contract", async () => {
			let coffeeHandler = await CoffeeHandler.deployed();
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
			let coffeeHandler = await CoffeeHandler.deployed();
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

		it("...should allow validators to stake DAI", async () => {
			let coffeeHandler = await CoffeeHandler.deployed();
			let daiToken = await DaiToken.deployed();
			let daiBalance = await daiToken.balanceOf(coffeeHandler.address);
			daiBalance.toNumber().should.equal(0, "Dai Balance should be 0");
			//mint dai
			//allow to stake
			//increase the balance of the contract
		});
	});
});
