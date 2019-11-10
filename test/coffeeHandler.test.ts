import { ethers } from "@nomiclabs/buidler";
import { deployContract, getWallets, solidity } from "ethereum-waffle";
import chai from "chai";
import CoffeeHandlerArtifact from "../build/CoffeeHandler.json";
import { CoffeeHandler } from "../typechain/CoffeeHandler";
import DaiTokenFactory from "../build/DaiToken.json";
import { DaiToken } from "../typechain/DaiToken";
import { utils, constants } from "ethers";

//Zeppeling helpers
chai.use(solidity);
const { expect } = chai;
require("chai").should();

describe("CoffeeHandler", () => {
	const provider = ethers.provider;
	let accounts = getWallets(provider);
	let coffeeHandler: CoffeeHandler;
	let notOwnerCoffeeHandler: CoffeeHandler;
	let daiToken: DaiToken;

	describe("Coffee Handler Validations", () => {
		let DAI_CONTRACT: string = constants.AddressZero;
		const WCC_CONTRACT: string = "0x1655a4C1FA32139AC1dE4cA0015Fc22429933115";
		const COFFEE_PRICE = 109;
		const STAKE_DAI_AMOUNT = utils.parseEther("100");
		const BIGGER_STAKE_DAI_AMOUNT = utils.parseEther("1000");
		const STAKE_RATE = utils.parseEther("150");

		before(async () => {
			coffeeHandler = (await deployContract(accounts[0], CoffeeHandlerArtifact)) as CoffeeHandler;
			daiToken = (await deployContract(accounts[0], DaiTokenFactory)) as DaiToken;
			expect(coffeeHandler.address).to.properAddress;
			expect(daiToken.address).to.properAddress;
			notOwnerCoffeeHandler = coffeeHandler.connect(accounts[1]);
		});

		it("...should set the DAI contract", async () => {
			DAI_CONTRACT = daiToken.address;
			let currentDAIContract = await coffeeHandler.DAI_CONTRACT();
			currentDAIContract.should.be.equal(constants.AddressZero);
			await expect(notOwnerCoffeeHandler.setDAIContract(DAI_CONTRACT)).to.be.reverted;

			// await expectRevert(
			// 	tokenFromOtherWallet.setDAIContract(DAI_CONTRACT),
			// 	"Ownable: caller is not the owner"
			// );
			// const receipt = await coffeeHandler.setDAIContract(DAI_CONTRACT, {
			// 	from: accounts[0]
			// });
			// expectEvent(receipt, "LogSetDAIContract", {
			// 	_owner: accounts[0],
			// 	_contract: DAI_CONTRACT
			// });
			// currentDAIContract = await coffeeHandler.DAI_CONTRACT();
			// currentDAIContract.should.be.equal(DAI_CONTRACT, "DAI Contract must be updated");
		});

		`	// it("...should set the WCC contract", async () => {
		// 	let coffeeHandler = await CoffeeHandler.deployed();
		// 	let currentWCCContract = await coffeeHandler.WCC_CONTRACT();
		// 	currentWCCContract.should.be.equal(constants.ZERO_ADDRESS);
		// 	await expectRevert(
		// 		coffeeHandler.setWCCContract(WCC_CONTRACT, { from: accounts[1] }),
		// 		"Ownable: caller is not the owner"
		// 	);
		// 	const receipt = await coffeeHandler.setWCCContract(WCC_CONTRACT, {
		// 		from: accounts[0]
		// 	});
		// 	expectEvent(receipt, "LogSetWCCContract", {
		// 		_owner: accounts[0],
		// 		_contract: WCC_CONTRACT
		// 	});
		// 	currentWCCContract = await coffeeHandler.WCC_CONTRACT();
		// 	currentWCCContract.should.be.equal(WCC_CONTRACT, "WCC Contract must be updated");
		// });

		// it("...should set the Coffee Commodity price", async () => {
		// 	let coffeeHandler = await CoffeeHandler.deployed();
		// 	let currentCoffeePrice = await coffeeHandler.COFFEE_PRICE();
		// 	await expectRevert(
		// 		coffeeHandler.setCoffeePrice(COFFEE_PRICE, { from: accounts[1] }),
		// 		"Ownable: caller is not the owner"
		// 	);
		// 	const receipt = await coffeeHandler.setCoffeePrice(COFFEE_PRICE, {
		// 		from: accounts[0]
		// 	});
		// 	expectEvent(receipt, "LogSetCoffeePrice", {
		// 		_owner: accounts[0],
		// 		_coffeePrice: COFFEE_PRICE
		// 	});
		// 	currentCoffeePrice = await coffeeHandler.COFFEE_PRICE();
		// 	expect(currentCoffeePrice.toNumber()).to.be.equal(
		// 		COFFEE_PRICE.toNumber(),
		// 		"Coffee Price must be updated"
		// 	);
		// });

		// it("...should set the stake rate", async () => {
		// 	let coffeeHandler = await CoffeeHandler.deployed();
		// 	let currentStakeRate = await coffeeHandler.STAKE_RATE();
		// 	await expectRevert(
		// 		coffeeHandler.setStakeRate(STAKE_RATE, { from: accounts[1] }),
		// 		"Ownable: caller is not the owner"
		// 	);
		// 	const receipt = await coffeeHandler.setStakeRate(STAKE_RATE, {
		// 		from: accounts[0]
		// 	});
		// 	expectEvent(receipt, "LogSetStakeRate", {
		// 		_owner: accounts[0],
		// 		_stakeRate: STAKE_RATE
		// 	});
		// 	currentStakeRate = await coffeeHandler.STAKE_RATE();
		// 	console.log("TCL: currentStakeRate", currentStakeRate);
		// 	expect(currentStakeRate).to.be.equal(STAKE_RATE, "Stake rate must be updated");
		// });

		// it("...should allow validators to stake DAI", async () => {
		// 	let coffeeHandler = await CoffeeHandler.deployed();
		// 	let daiToken = await DaiToken.deployed();
		// 	let daiBalance = await daiToken.balanceOf(coffeeHandler.address);
		// 	daiBalance.toNumber().should.equal(0, "DAI Balance should be 0");
		// 	await expectRevert(
		// 		coffeeHandler.stakeDAI(STAKE_DAI_AMOUNT, { from: accounts[1] }),
		// 		"Not enough balance"
		// 	);
		// 	await daiToken.faucet(1000, { from: accounts[1] });
		// 	await expectRevert(
		// 		coffeeHandler.stakeDAI(STAKE_DAI_AMOUNT, { from: accounts[1] }),
		// 		"Contract allowance is to low or not approved"
		// 	);
		// 	await daiToken.approve(coffeeHandler.address, STAKE_DAI_AMOUNT, { from: accounts[1] });
		// 	const receipt = await coffeeHandler.stakeDAI(STAKE_DAI_AMOUNT, { from: accounts[1] });
		// 	expectEvent(receipt, "LogStakeDAI", {
		// 		_staker: accounts[1],
		// 		_amount: STAKE_DAI_AMOUNT,
		// 		_currentStake: STAKE_DAI_AMOUNT
		// 	});
		// 	daiBalance = await daiToken.balanceOf(coffeeHandler.address);
		// 	expect(daiBalance.toNumber()).to.equal(
		// 		STAKE_DAI_AMOUNT.toNumber(),
		// 		"Dai Balance should increase to stake"
		// 	);
		// 	const currentStake = await coffeeHandler.userToStake(accounts[1]);
		// 	expect(currentStake.toNumber()).to.equal(
		// 		STAKE_DAI_AMOUNT.toNumber(),
		// 		"Stake counter should increase"
		// 	);
		// 	daiBalance = await daiToken.balanceOf(accounts[1]);
		// 	expect(daiBalance.toNumber()).to.equal(900, "Validator's DAI Balance should decrease");
		// });

		// it("...should allow validators to remove stake of DAI", async () => {
		// 	let coffeeHandler = await CoffeeHandler.deployed();
		// 	let daiToken = await DaiToken.deployed();
		// 	await expectRevert(
		// 		coffeeHandler.removeStakedDAI(BIGGER_STAKE_DAI_AMOUNT, { from: accounts[1] }),
		// 		"Amount bigger than current available to retrive"
		// 	);
		// 	const receipt = await coffeeHandler.removeStakedDAI(STAKE_DAI_AMOUNT, {
		// 		from: accounts[1]
		// 	});
		// 	expectEvent(receipt, "LogRemoveStakedDAI", {
		// 		_staker: accounts[1],
		// 		_amount: STAKE_DAI_AMOUNT,
		// 		_currentStake: new BN(0)
		// 	});
		// 	let daiBalance = await daiToken.balanceOf(coffeeHandler.address);
		// 	expect(daiBalance.toNumber()).to.equal(0, "DAI Balance should decrease to retrieved stake");
		// 	const currentStake = await coffeeHandler.userToStake(accounts[1]);
		// 	expect(currentStake.toNumber()).to.equal(0, "Stake counter should increase");
		// 	daiBalance = await daiToken.balanceOf(accounts[1]);
		// 	expect(daiBalance.toNumber()).to.equal(1000, "Validator's DAI Balance should decrease");
		// });

		// it("...should allow validators to mint WCC", async () => {
		// 	let coffeeHandler = await CoffeeHandler.deployed();
		// 	await expectRevert(
		// 		coffeeHandler.mintTokens(STAKE_DAI_AMOUNT, { from: accounts[1] }),
		// 		"Not enough DAI Staked"
		// 	);
		// });`;
	});
});
