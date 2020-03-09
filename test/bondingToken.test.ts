import { ethers, waffle } from "@nomiclabs/buidler";
import { deployContract, getWallets, solidity } from "ethereum-waffle";
import BondingTokenArtifact from "../artifacts/BondingToken.json";
import { BondingToken } from "../typechain/BondingToken";
import chai from "chai";
import { constants } from "ethers";

chai.use(solidity);
const { expect } = chai;
require("chai").should();

describe("BondingToken", () => {
  describe("ERC20 Validations", () => {
    const IPFS_HASH = "QmaoLeVeFjGDGk6mL7JBiEKS9nFvqdEHvmxpXXQGEvySSN";
    let accounts = getWallets(waffle.provider);
    let bondingToken: BondingToken;

    before(async () => {
      bondingToken = (await deployContract(accounts[0], BondingTokenArtifact, [
        "Single Coffee Token",
        "CAFE",
        0
      ])) as BondingToken;
      expect(bondingToken.address).to.properAddress;
    });

    it("...should set the token details", async () => {
      let name = await bondingToken.name();
      let symbol = await bondingToken.symbol();
      let decimals = await bondingToken.decimals();
      name.should.be.equal("Single Coffee Token");
      symbol.should.be.equal("CAFE");
      decimals.should.be.equal(0);
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
  });
});
