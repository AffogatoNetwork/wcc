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
	let notOwnerDaiToken: DaiToken;

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
			notOwnerDaiToken = daiToken.connect(accounts[1]);
		});

		it("...should set the DAI contract", async () => {
			DAI_CONTRACT = daiToken.address;
			let currentDAIContract = await coffeeHandler.DAI_CONTRACT();
			currentDAIContract.should.be.equal(constants.AddressZero);
			await expect(notOwnerCoffeeHandler.setDAIContract(DAI_CONTRACT)).to.be.revertedWith(
				"Ownable: caller is not the owner"
			);
			await expect(coffeeHandler.setDAIContract(DAI_CONTRACT))
				.to.emit(coffeeHandler, "LogSetDAIContract")
				.withArgs(accounts[0].address, DAI_CONTRACT);
			currentDAIContract = await coffeeHandler.DAI_CONTRACT();
			currentDAIContract.should.be.equal(DAI_CONTRACT, "DAI Contract must be updated");
		});

		it("...should set the WCC contract", async () => {
			let currentWCCContract = await coffeeHandler.WCC_CONTRACT();
			currentWCCContract.should.be.equal(constants.AddressZero);
			await expect(notOwnerCoffeeHandler.setWCCContract(WCC_CONTRACT)).to.be.revertedWith(
				"Ownable: caller is not the owner"
			);
			await expect(coffeeHandler.setWCCContract(WCC_CONTRACT))
				.to.emit(coffeeHandler, "LogSetWCCContract")
				.withArgs(accounts[0].address, WCC_CONTRACT);
			currentWCCContract = await coffeeHandler.WCC_CONTRACT();
			currentWCCContract.should.be.equal(WCC_CONTRACT, "WCC Contract must be updated");
		});

		it("...should set the Coffee Commodity price", async () => {
			let currentCoffeePrice = await coffeeHandler.COFFEE_PRICE();
			await expect(notOwnerCoffeeHandler.setCoffeePrice(COFFEE_PRICE)).to.be.revertedWith(
				"Ownable: caller is not the owner"
			);
			await expect(coffeeHandler.setCoffeePrice(COFFEE_PRICE))
				.to.emit(coffeeHandler, "LogSetCoffeePrice")
				.withArgs(accounts[0].address, COFFEE_PRICE);
			currentCoffeePrice = await coffeeHandler.COFFEE_PRICE();
			expect(currentCoffeePrice).to.be.equal(COFFEE_PRICE, "Coffee Price must be updated");
		});

		it("...should set the stake rate", async () => {
			let currentStakeRate = await coffeeHandler.STAKE_RATE();
			await expect(notOwnerCoffeeHandler.setCoffeePrice(STAKE_RATE)).to.be.revertedWith(
				"Ownable: caller is not the owner"
			);
			await expect(coffeeHandler.setStakeRate(STAKE_RATE))
				.to.emit(coffeeHandler, "LogSetStakeRate")
				.withArgs(accounts[0].address, STAKE_RATE);
			currentStakeRate = await coffeeHandler.STAKE_RATE();
			expect(currentStakeRate).to.be.equal(STAKE_RATE, "Stake rate must be updated");
		});

		it("...should allow validators to stake DAI", async () => {
			let daiBalance = await daiToken.balanceOf(coffeeHandler.address);
			daiBalance.should.equal(0, "DAI Balance should be 0");
			await expect(notOwnerCoffeeHandler.stakeDAI(STAKE_DAI_AMOUNT)).to.be.revertedWith(
				"Not enough balance"
			);
			await notOwnerDaiToken.faucet(BIGGER_STAKE_DAI_AMOUNT);
			daiBalance = await daiToken.balanceOf(accounts[1].address);
			await expect(notOwnerCoffeeHandler.stakeDAI(STAKE_DAI_AMOUNT)).to.be.revertedWith(
				"Contract allowance is to low or not approved"
			);
			await notOwnerDaiToken.approve(coffeeHandler.address, STAKE_DAI_AMOUNT);
			await expect(notOwnerCoffeeHandler.stakeDAI(STAKE_DAI_AMOUNT))
				.to.emit(coffeeHandler, "LogStakeDAI")
				.withArgs(accounts[1].address, STAKE_DAI_AMOUNT, STAKE_DAI_AMOUNT);
			daiBalance = await daiToken.balanceOf(coffeeHandler.address);
			expect(daiBalance).to.equal(STAKE_DAI_AMOUNT, "Dai Balance should increase to stake");
			const currentStake = await coffeeHandler.userToStake(accounts[1].address);
			expect(currentStake).to.equal(STAKE_DAI_AMOUNT, "Stake counter should increase");
			daiBalance = await daiToken.balanceOf(accounts[1].address);
			expect(daiBalance).to.equal(
				utils.parseEther("900"),
				"Validator's DAI Balance should decrease"
			);
		});

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
