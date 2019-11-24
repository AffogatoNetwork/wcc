import { ethers } from "@nomiclabs/buidler";
import { deployContract, getWallets, solidity } from "ethereum-waffle";
import chai from "chai";
import CoffeeHandlerArtifact from "../build/CoffeeHandler.json";
import { CoffeeHandler } from "../typechain/CoffeeHandler";
import DaiTokenFactory from "../build/DaiToken.json";
import { DaiToken } from "../typechain/DaiToken";
import WrappedCoffeeCoinArtifact from "../build/WrappedCoffeeCoin.json";
import { WrappedCoffeeCoin } from "../typechain/WrappedCoffeeCoin";
import { utils, constants } from "ethers";

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
  let wrappedCoffeeCoin: WrappedCoffeeCoin;
  let wccInstance: WrappedCoffeeCoin[] = [];

  describe("Coffee Handler Validations", () => {
    let DAI_CONTRACT: string = constants.AddressZero;
    let WCC_CONTRACT: string = constants.AddressZero;
    const COFFEE_PRICE = "2";
    const STAKE_DAI_AMOUNT = utils.parseEther("100");
    const MINT_AMOUNT = utils.parseEther("10");
    const LOW_MINT_AMOUNT = utils.parseEther("5");
    const LOW_MINT_STAKE = utils.parseEther("85");
    const BIGGER_STAKE_DAI_AMOUNT = utils.parseEther("1000");
    const STAKE_RATE = 150;
    const THREE_MONTHS = 7776000;
    const SIX_MONTHS = 15552000;

    before(async () => {
      coffeeHandler = (await deployContract(accounts[0], CoffeeHandlerArtifact)) as CoffeeHandler;
      daiToken = (await deployContract(accounts[0], DaiTokenFactory)) as DaiToken;
      wrappedCoffeeCoin = (await deployContract(
        accounts[0],
        WrappedCoffeeCoinArtifact
      )) as WrappedCoffeeCoin;
      expect(coffeeHandler.address).to.properAddress;
      expect(daiToken.address).to.properAddress;
      expect(wrappedCoffeeCoin.address).to.properAddress;
      coffeeHandlerInstance[1] = coffeeHandler.connect(accounts[1]);
      coffeeHandlerInstance[2] = coffeeHandler.connect(accounts[2]);
      daiTokenInstance[1] = daiToken.connect(accounts[1]);
      daiTokenInstance[2] = daiToken.connect(accounts[2]);
      daiTokenInstance[3] = daiToken.connect(accounts[3]);
      wccInstance[1] = wrappedCoffeeCoin.connect(accounts[1]);
      wccInstance[2] = wrappedCoffeeCoin.connect(accounts[2]);
      wrappedCoffeeCoin.setCoffeeHandler(coffeeHandler.address);
      WCC_CONTRACT = wrappedCoffeeCoin.address;
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

    it("...should get the required amount", async () => {
      let requiredAmount = await coffeeHandler.requiredAmount(MINT_AMOUNT);
      expect(requiredAmount).to.eq(
        utils.parseEther("30"),
        "Equal to the amount * 150% * coffee price"
      );
    });

    it("...should allow validators to mint WCC", async () => {
      let userToValidator = await coffeeHandler.userToValidator(accounts[2].address);
      userToValidator.should.eq(constants.AddressZero, "Validator must be 0");
      let tokensMintApproved = await coffeeHandler.tokensMintApproved(
        accounts[2].address,
        accounts[1].address
      );
      expect(tokensMintApproved).to.be.eq(0, "Approve tokens must be 0");
      let wccBalance = await wrappedCoffeeCoin.balanceOf(accounts[1].address);
      wccBalance.should.equal(0, "WCC Balance should be 0");
      await expect(
        coffeeHandlerInstance[1].mintTokens(accounts[2].address, MINT_AMOUNT)
      ).to.be.revertedWith("Mint value bigger than approved by user");
      await expect(coffeeHandlerInstance[2].approveMint(accounts[1].address, MINT_AMOUNT))
        .to.emit(coffeeHandler, "LogApproveMint")
        .withArgs(accounts[2].address, accounts[1].address, MINT_AMOUNT);
      tokensMintApproved = await coffeeHandler.tokensMintApproved(
        accounts[2].address,
        accounts[1].address
      );
      expect(tokensMintApproved).to.be.eq(MINT_AMOUNT, "Approve tokens must increase");
      await expect(
        coffeeHandlerInstance[1].mintTokens(accounts[2].address, STAKE_DAI_AMOUNT)
      ).to.be.revertedWith("Mint value bigger than approved by user");
      await expect(
        coffeeHandlerInstance[1].mintTokens(accounts[2].address, MINT_AMOUNT)
      ).to.be.revertedWith("Not enough DAI Staked");
      await daiTokenInstance[1].approve(coffeeHandler.address, STAKE_DAI_AMOUNT);
      await coffeeHandlerInstance[1].stakeDAI(STAKE_DAI_AMOUNT);
      let currentStake = await coffeeHandler.userToStake(accounts[1].address);
      expect(currentStake).to.equal(STAKE_DAI_AMOUNT, "Stake counter should increase");
      let usedStake = await coffeeHandler.tokensUsed(accounts[1].address);
      expect(usedStake).to.equal(0, "Stake counter should be 0");
      await expect(coffeeHandlerInstance[1].mintTokens(accounts[2].address, MINT_AMOUNT))
        .to.emit(coffeeHandler, "LogMintTokens")
        .withArgs(accounts[1].address, accounts[2].address, MINT_AMOUNT, MINT_AMOUNT);
      tokensMintApproved = await coffeeHandler.tokensMintApproved(
        accounts[2].address,
        accounts[1].address
      );
      expect(tokensMintApproved).to.be.eq(0, "Should reset to 0");
      userToValidator = await coffeeHandler.userToValidator(accounts[2].address);
      userToValidator.should.eq(accounts[1].address, "Validator must be set");
      currentStake = await coffeeHandler.userToStake(accounts[1].address);
      expect(currentStake).to.equal(utils.parseEther("70"), "Stake counter should decrease");
      usedStake = await coffeeHandler.tokensUsed(accounts[1].address);
      expect(usedStake).to.equal(MINT_AMOUNT, "Stake counter should increase");
      wccBalance = await wrappedCoffeeCoin.balanceOf(accounts[1].address);
      wccBalance.should.equal(0, "WCC Balance should be 0");
      wccBalance = await wrappedCoffeeCoin.balanceOf(accounts[2].address);
      wccBalance.should.equal(MINT_AMOUNT, "WCC Balance should increase");
      let totalSupply = await wrappedCoffeeCoin.totalSupply();
      totalSupply.should.be.eq(MINT_AMOUNT);
    });

    it("...should allow validators to burn WCC", async () => {
      let wccBalance = await wrappedCoffeeCoin.balanceOf(accounts[2].address);
      wccBalance.should.equal(MINT_AMOUNT, "WCC Balance should be Minted amount");
      await expect(coffeeHandlerInstance[1].burnTokens(LOW_MINT_AMOUNT)).to.be.revertedWith(
        "Burn amount higher than stake minted"
      );
      await wccInstance[2].approve(coffeeHandler.address, MINT_AMOUNT);
      await expect(coffeeHandlerInstance[2].burnTokens(BIGGER_STAKE_DAI_AMOUNT)).to.be.revertedWith(
        "Burn amount higher than stake minted"
      );
      await expect(coffeeHandlerInstance[2].burnTokens(LOW_MINT_AMOUNT))
        .to.emit(coffeeHandler, "LogBurnTokens")
        .withArgs(accounts[1].address, accounts[2].address, LOW_MINT_AMOUNT, LOW_MINT_AMOUNT);
      await expect(coffeeHandlerInstance[1].burnTokens(MINT_AMOUNT)).to.be.revertedWith(
        "Burn amount higher than stake minted"
      );
      let currentStake = await coffeeHandler.userToStake(accounts[1].address);
      expect(currentStake).to.equal(LOW_MINT_STAKE, "Stake counter should increase");
      let usedStake = await coffeeHandler.tokensUsed(accounts[1].address);
      expect(usedStake).to.equal(LOW_MINT_AMOUNT, "Stake counter should decrease");
      wccBalance = await wrappedCoffeeCoin.balanceOf(accounts[2].address);
      wccBalance.should.equal(LOW_MINT_AMOUNT, "WCC Balance should decrease");
      let totalSupply = await wrappedCoffeeCoin.totalSupply();
      totalSupply.should.be.eq(LOW_MINT_AMOUNT, "Total supply should decrease");
    });

    it("...should allow users to change their wcc for DAI after 3 Months", async () => {
      let daiBalance = await daiToken.balanceOf(accounts[2].address);
      expect(daiBalance).to.be.eq(0, "Initial balance should be 0");
      await expect(coffeeHandlerInstance[1].redeemTokens(MINT_AMOUNT)).to.be.revertedWith(
        "only available after 3 months of deployment"
      );
      await ethers.provider.send("evm_increaseTime", [THREE_MONTHS]);
      await expect(coffeeHandlerInstance[1].redeemTokens(MINT_AMOUNT)).to.be.revertedWith(
        "Redeem amount is higher than redeemable amount"
      );
      await expect(coffeeHandlerInstance[1].redeemTokens(LOW_MINT_AMOUNT)).to.be.revertedWith(
        "Redeem amount is higher than redeemable amount"
      );
      await expect(coffeeHandlerInstance[2].redeemTokens(LOW_MINT_AMOUNT))
        .to.emit(coffeeHandler, "LogRedeemTokens")
        .withArgs(accounts[1].address, accounts[2].address, LOW_MINT_AMOUNT, 0);
      daiBalance = await daiToken.balanceOf(accounts[2].address);
      expect(daiBalance).to.be.equal(MINT_AMOUNT, "Balance should be 10");
      daiBalance = await daiToken.balanceOf(coffeeHandler.address);
      expect(daiBalance).to.be.equal(
        STAKE_DAI_AMOUNT.sub(MINT_AMOUNT),
        "Initial balance should be 0"
      );
      let currentStake = await coffeeHandler.userToStake(accounts[1].address);
      expect(currentStake).to.equal(
        STAKE_DAI_AMOUNT.sub(MINT_AMOUNT),
        "Stake counter should increase"
      );
      let usedStake = await coffeeHandler.tokensUsed(accounts[1].address);
      expect(usedStake).to.equal(0, "Stake counter should decrease");
      let wccBalance = await wrappedCoffeeCoin.balanceOf(accounts[2].address);
      wccBalance.should.equal(0, "WCC Balance should decrease");
      let totalSupply = await wrappedCoffeeCoin.totalSupply();
      totalSupply.should.be.equal(0, "Total supply should decrease");
    });

    it("...should allow validators to remove all staked DAI", async () => {
      await expect(coffeeHandlerInstance[1].removeAllStakedDAI())
        .to.emit(coffeeHandler, "LogRemoveAllStakedDAI")
        .withArgs(accounts[1].address, STAKE_DAI_AMOUNT.sub(MINT_AMOUNT), 0);
      let daiBalance = await daiToken.balanceOf(coffeeHandler.address);
      expect(daiBalance).to.equal(0, "DAI Balance should decrease to retrieved stake");
      const currentStake = await coffeeHandler.userToStake(accounts[1].address);
      expect(currentStake).to.equal(0, "Stake counter should increase");
      daiBalance = await daiToken.balanceOf(accounts[1].address);
      expect(daiBalance).to.equal(
        BIGGER_STAKE_DAI_AMOUNT.sub(MINT_AMOUNT),
        "Validator's DAI Balance should increase"
      );
    });

    it("...should pause staking after 3 months", async () => {
      await daiTokenInstance[1].approve(coffeeHandler.address, STAKE_DAI_AMOUNT);
      await expect(coffeeHandlerInstance[1].stakeDAI(STAKE_DAI_AMOUNT)).to.be.revertedWith(
        "only available during the 3 months of deployment"
      );
    });

    it("...should allow to retrieve all locked stake after 6 months", async () => {
      let newInstance = (await deployContract(accounts[0], CoffeeHandlerArtifact)) as CoffeeHandler;
      await newInstance.setCoffeePrice(COFFEE_PRICE);
      await newInstance.setDAIContract(DAI_CONTRACT);
      await newInstance.setWCCContract(WCC_CONTRACT);
      newInstance = newInstance.connect(accounts[3]);
      await daiTokenInstance[3].faucet(BIGGER_STAKE_DAI_AMOUNT);
      await daiTokenInstance[3].approve(newInstance.address, BIGGER_STAKE_DAI_AMOUNT);
      let daiBalance = await daiToken.balanceOf(newInstance.address);
      expect(daiBalance).to.equal(0, "DAI Balance should be 0 ");
      await newInstance.stakeDAI(BIGGER_STAKE_DAI_AMOUNT);
      await expect(newInstance.liquidateStakedDAI()).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
      newInstance = newInstance.connect(accounts[0]);
      await expect(newInstance.liquidateStakedDAI()).to.be.revertedWith(
        "only available after 6 months of deployment"
      );
      await ethers.provider.send("evm_increaseTime", [SIX_MONTHS]);
      await expect(newInstance.liquidateStakedDAI())
        .to.emit(newInstance, "LogLiquidateStakedDAI")
        .withArgs(accounts[0].address, BIGGER_STAKE_DAI_AMOUNT);
      daiBalance = await daiToken.balanceOf(newInstance.address);
      expect(daiBalance).to.equal(0, "DAI Balance should be 0 ");
      daiBalance = await daiToken.balanceOf(accounts[0].address);
      expect(daiBalance).to.equal(
        BIGGER_STAKE_DAI_AMOUNT,
        "DAI Balance should be all the staked DAI "
      );
    });
  });
});
