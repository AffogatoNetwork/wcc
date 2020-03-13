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

    it("...should allow users to mint a token", async () => {
      let balance = await bondingToken.balanceOf(accounts[1].address);
      balance.should.eq(0);
      let amount = utils.parseEther("1");
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
    });

    it("...should cost the minimun value while inflection point is low", async () => {
      let iterator = 2;
      while (iterator < inflectionPoint) {
        let amount = utils.parseEther("1");
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
      let amount = utils.parseEther("1");
      await expect(bondingTokenInstance[1].buyToken({ value: amount })).to.be.revertedWith(
        "Not enought payment"
      );
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
