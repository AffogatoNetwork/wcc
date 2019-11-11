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
	let coffeeHandlerInstance: CoffeeHandler[] = [];
	let daiToken: DaiToken;
	let daiTokenInstance: DaiToken[] = [];

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
			coffeeHandlerInstance[1] = coffeeHandler.connect(accounts[1]);
			daiTokenInstance[1] = daiToken.connect(accounts[1]);
		});

		it("...should set the DAI contract", async () => {
			DAI_CONTRACT = daiToken.address;
			let currentDAIContract = await coffeeHandler.DAI_CONTRACT();
			currentDAIContract.should.be.equal(constants.AddressZero);
			await expect(coffeeHandlerInstance[1].setDAIContract(DAI_CONTRACT)).to.be.revertedWith(
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
			await expect(coffeeHandlerInstance[1].setWCCContract(WCC_CONTRACT)).to.be.revertedWith(
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
			await expect(coffeeHandlerInstance[1].setCoffeePrice(COFFEE_PRICE)).to.be.revertedWith(
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
			await expect(coffeeHandlerInstance[1].setCoffeePrice(STAKE_RATE)).to.be.revertedWith(
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
			await expect(coffeeHandlerInstance[1].stakeDAI(STAKE_DAI_AMOUNT)).to.be.revertedWith(
				"Not enough balance"
			);
			await daiTokenInstance[1].faucet(BIGGER_STAKE_DAI_AMOUNT);
			daiBalance = await daiToken.balanceOf(accounts[1].address);
			await expect(coffeeHandlerInstance[1].stakeDAI(STAKE_DAI_AMOUNT)).to.be.revertedWith(
				"Contract allowance is to low or not approved"
			);
			await daiTokenInstance[1].approve(coffeeHandler.address, STAKE_DAI_AMOUNT);
			await expect(coffeeHandlerInstance[1].stakeDAI(STAKE_DAI_AMOUNT))
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

		it("...should allow validators to remove stake of DAI", async () => {
			await expect(
				coffeeHandlerInstance[1].removeStakedDAI(BIGGER_STAKE_DAI_AMOUNT)
			).to.be.revertedWith("Amount bigger than current available to retrive");
			await expect(coffeeHandlerInstance[1].removeStakedDAI(STAKE_DAI_AMOUNT))
				.to.emit(coffeeHandler, "LogRemoveStakedDAI")
				.withArgs(accounts[1].address, STAKE_DAI_AMOUNT, 0);
			let daiBalance = await daiToken.balanceOf(coffeeHandler.address);
			expect(daiBalance).to.equal(0, "DAI Balance should decrease to retrieved stake");
			const currentStake = await coffeeHandler.userToStake(accounts[1].address);
			expect(currentStake).to.equal(0, "Stake counter should increase");
			daiBalance = await daiToken.balanceOf(accounts[1].address);
			expect(daiBalance).to.equal(
				BIGGER_STAKE_DAI_AMOUNT,
				"Validator's DAI Balance should increase"
			);
		});

		it("...should allow validators to mint WCC", async () => {
			await expect(coffeeHandlerInstance[1].mintTokens(STAKE_DAI_AMOUNT)).to.be.revertedWith(
				"Not enough DAI Staked"
			);
		});
	});
});
