import { waffle } from "@nomiclabs/buidler";
import { deployContract, getWallets, solidity } from "ethereum-waffle";
import BondingTokenArtifact from "../artifacts/BondingToken.json";
import { BondingToken } from "../typechain/BondingToken";
import chai from "chai";
import { constants, utils } from "ethers";

chai.use(solidity);
const { expect } = chai;
require("chai").should();

describe("BondingToken", () => {
  let bondingTokenInstance: BondingToken[] = [];
  let name = "Single Coffee Token";
  let symbol = "CAFE";
  let decimals = 0;
  let maximumValue = 10;
  let inflectionPoint = 5;
  let steppeness = 75;
  let initialValue = 10;
  let maximumMint = 30;
  let etherPrice = utils.parseEther("0.1");

  describe("ERC20 Validations", () => {
    const IPFS_HASH = "QmaoLeVeFjGDGk6mL7JBiEKS9nFvqdEHvmxpXXQGEvySSN";
    let accounts = getWallets(waffle.provider);
    let bondingToken: BondingToken;

    before(async () => {
      bondingToken = (await deployContract(accounts[0], BondingTokenArtifact, [
        name,
        symbol,
        decimals,
        maximumValue,
        inflectionPoint,
        steppeness,
        initialValue,
        maximumMint,
        etherPrice
      ])) as BondingToken;
      expect(bondingToken.address).to.properAddress;
      bondingTokenInstance[1] = bondingToken.connect(accounts[1]);
      bondingTokenInstance[2] = bondingToken.connect(accounts[2]);
      bondingTokenInstance[3] = bondingToken.connect(accounts[3]);
    });

    it("...should set the token details", async () => {
      let name = await bondingToken.name();
      let symbol = await bondingToken.symbol();
      let decimals = await bondingToken.decimals();
      let maximumValue = await bondingToken.maximumValue();
      let midValue = await bondingToken.midValue();
      let inflectionPoint = await bondingToken.inflectionPoint();
      let steppeness = await bondingToken.steppeness();
      let initialValue = await bondingToken.initialValue();
      let maximumMint = await bondingToken.maximumMint();
      let poolBalance = await bondingToken.poolBalance();
      let totalSupply = await bondingToken.totalSupply();
      let etherPrice = await bondingToken.etherPrice();
      name.should.be.equal("Single Coffee Token");
      symbol.should.be.equal("CAFE");
      decimals.should.be.equal(0);
      maximumValue.should.eq(10);
      midValue.should.eq(5);
      inflectionPoint.should.eq(5);
      steppeness.should.eq(75);
      initialValue.should.eq(10);
      maximumMint.should.eq(30);
      poolBalance.should.eq(0);
      totalSupply.should.eq(0);
      etherPrice.should.eq(etherPrice);
    });

    it("...should set the coffee information", async () => {
      let ipfsHash = await bondingToken.getCoffee();
      ipfsHash.should.eq("", "Hash should be empty");
      let wccNotOwner = bondingToken.connect(accounts[1]);
      await expect(wccNotOwner.updateCoffee(IPFS_HASH)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
      await expect(bondingToken.updateCoffee("")).to.be.revertedWith(
        "The IPFS pointer cannot be empty"
      );
      await expect(bondingToken.updateCoffee(IPFS_HASH))
        .to.emit(bondingToken, "LogUpdateCoffee")
        .withArgs(accounts[0].address, IPFS_HASH);
      ipfsHash = await bondingToken.getCoffee();
      ipfsHash.should.eq(IPFS_HASH, "Hash should be updated");
    });

    it("...should allow users to get the price of a token", async () => {
      let iterator = 1;
      while (iterator <= inflectionPoint) {
        let amount = await bondingToken.tokenPrice(iterator);
        amount.should.eq(utils.parseEther("1"));
        iterator++;
      }
      let amount = await bondingToken.tokenPrice(6);
      amount.should.eq(utils.parseEther("1.5"));
    });

    it("...should allow users to mint a token", async () => {
      let balance = await bondingToken.balanceOf(accounts[1].address);
      balance.should.eq(0);
      let amount = await bondingToken.tokenPrice(1);
      let accountBalance = await waffle.provider.getBalance(accounts[1].address);
      await expect(bondingTokenInstance[1].buyToken()).to.be.revertedWith("Not enought payment");
      await expect(bondingTokenInstance[1].buyToken({ value: amount }))
        .to.emit(bondingToken, "LogBuyToken")
        .withArgs(accounts[1].address, amount);
      balance = await bondingToken.balanceOf(accounts[1].address);
      balance.should.eq(1);
      let totalSupply = await bondingToken.totalSupply();
      totalSupply.should.eq(1);
      let poolBalance = await bondingToken.poolBalance();
      poolBalance.should.eq(amount);
      let contractBalance = await waffle.provider.getBalance(bondingToken.address);
      contractBalance.should.eq(poolBalance);
      let newAccountBalance = await waffle.provider.getBalance(accounts[1].address);
      expect(newAccountBalance.lt(accountBalance)).to.be.true;
    });

    it("...should cost the minimun value while inflection point is low", async () => {
      let iterator = 2;
      while (iterator <= inflectionPoint) {
        let amount = await bondingToken.tokenPrice(1);
        await expect(bondingTokenInstance[1].buyToken({ value: amount }))
          .to.emit(bondingToken, "LogBuyToken")
          .withArgs(accounts[1].address, amount);
        let balance = await bondingToken.balanceOf(accounts[1].address);
        balance.should.eq(iterator);
        let totalSupply = await bondingToken.totalSupply();
        totalSupply.should.eq(iterator);
        let poolBalance = await bondingToken.poolBalance();
        poolBalance.should.eq(amount.mul(iterator));
        let contractBalance = await waffle.provider.getBalance(bondingToken.address);
        contractBalance.should.eq(poolBalance);
        iterator++;
      }
      let amount = await bondingToken.tokenPrice(5);
      await expect(bondingTokenInstance[1].buyToken({ value: amount })).to.be.revertedWith(
        "Not enought payment"
      );
      amount = await bondingToken.tokenPrice(6);
      await expect(bondingTokenInstance[1].buyToken({ value: amount }))
        .to.emit(bondingToken, "LogBuyToken")
        .withArgs(accounts[1].address, amount);
      amount = await bondingToken.tokenPrice(7);
      await expect(bondingTokenInstance[1].buyToken({ value: amount }))
        .to.emit(bondingToken, "LogBuyToken")
        .withArgs(accounts[1].address, amount);
    });

    it("...should buy all tokens", async () => {
      let iterator = (await bondingToken.totalSupply()).toNumber() + 1;
      while (iterator <= maximumMint) {
        let amount = await bondingToken.tokenPrice(iterator);
        await expect(bondingTokenInstance[1].buyToken({ value: amount }))
          .to.emit(bondingToken, "LogBuyToken")
          .withArgs(accounts[1].address, amount);
        let balance = await bondingToken.balanceOf(accounts[1].address);
        balance.should.eq(iterator);
        let totalSupply = await bondingToken.totalSupply();
        totalSupply.should.eq(iterator);
        let poolBalance = await bondingToken.poolBalance();
        let contractBalance = await waffle.provider.getBalance(bondingToken.address);
        contractBalance.should.eq(poolBalance);
        iterator++;
      }
      let amount = await bondingToken.tokenPrice(iterator);
      await expect(bondingTokenInstance[1].buyToken({ value: amount })).to.be.revertedWith(
        "Can't mint more tokens"
      );
    });

    it("...should allow users to burn a token", async () => {
      let contractBalance = await waffle.provider.getBalance(bondingToken.address);
      let accountBalance = await waffle.provider.getBalance(accounts[1].address);
      let tokenBalance = await bondingToken.balanceOf(accounts[1].address);
      let poolBalance = await bondingToken.poolBalance();
      let totalSupply = await bondingToken.totalSupply();
      let amount = await bondingToken.tokenPrice(totalSupply);
      await expect(bondingTokenInstance[2].burnToken()).to.be.revertedWith(
        "Not enough tokens to burn"
      );
      await expect(bondingTokenInstance[1].burnToken())
        .to.emit(bondingToken, "LogBurnToken")
        .withArgs(accounts[1].address, 1, amount);
      let newTokenBalance = await bondingToken.balanceOf(accounts[1].address);
      expect(newTokenBalance.lt(tokenBalance)).to.be.true;
      let newTotalSupply = await bondingToken.totalSupply();
      expect(newTotalSupply.lt(totalSupply)).to.be.true;
      let newPoolBalance = await bondingToken.poolBalance();
      expect(newPoolBalance.lt(poolBalance)).to.be.true;
      let newContractBalance = await waffle.provider.getBalance(bondingToken.address);
      expect(newContractBalance.lt(contractBalance)).to.be.true;
      newContractBalance.should.eq(newPoolBalance);
      let newAccountBalance = await waffle.provider.getBalance(accounts[1].address);
      expect(newAccountBalance.gt(accountBalance)).to.be.true;
      contractBalance.should.eq(newContractBalance.add(amount));
    });
  });

  /** TODO:
   * Buy single token
   * Burn single token
   * Buy multiple tokens
   * Burn multiple tokens
   * Configure parameters
   * Create Token Factory
   */

  // it("...should set minter", async () => {

  // });
});
