import BigNumber from "bignumber.js";

require("chai").should();
require("chai").expect;

//Zeppeling helpers

//@ts-ignore
const { BN, constants, balance, expectEvent, expectRevert } = require("@openzeppelin/test-helpers");
var CoffeeHandler = artifacts.require("CoffeeHandler");
var DaiToken = artifacts.require("DaiToken");

contract("CoffeeHandler", accounts => {
	describe("Coffee Handler Validations", () => {
		let DAI_CONTRACT: string = constants.ZERO_ADDRESS;
		const WCC_CONTRACT: string = "0x1655a4C1FA32139AC1dE4cA0015Fc22429933115";
		const STAKE_DAI_AMOUNT: BigNumber = new BN(100);

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
			await expectRevert(
				coffeeHandler.stakeDAI(STAKE_DAI_AMOUNT, { from: accounts[1] }),
				"Not enough balance"
			);
			await daiToken.faucet(1000, { from: accounts[1] });
			await expectRevert(
				coffeeHandler.stakeDAI(STAKE_DAI_AMOUNT, { from: accounts[1] }),
				"Contract allowance is to low or not approved"
			);
			await daiToken.approve(coffeeHandler.address, STAKE_DAI_AMOUNT, { from: accounts[1] });
			const receipt = await coffeeHandler.stakeDAI(STAKE_DAI_AMOUNT, { from: accounts[1] });
			expectEvent(receipt, "LogStakeDAI", {
				_staker: accounts[1],
				_amount: STAKE_DAI_AMOUNT,
				_currentStake: STAKE_DAI_AMOUNT
			});
			daiBalance = await daiToken.balanceOf(coffeeHandler.address);
			expect(daiBalance.toNumber()).to.equal(
				STAKE_DAI_AMOUNT.toNumber(),
				"Dai Balance should increase to stake"
			);
			const currentStake = await coffeeHandler.userToStake(accounts[1]);
			expect(currentStake.toNumber()).to.equal(
				STAKE_DAI_AMOUNT.toNumber(),
				"Stake counter should increase"
			);
			daiBalance = await daiToken.balanceOf(accounts[1]);
			expect(daiBalance.toNumber()).to.equal(900, "Validator's Dai Balance should decrease");
		});

		it("...should allow validators to remove stake of DAI", async () => {});
	});
});
