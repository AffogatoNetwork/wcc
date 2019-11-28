import { ethers } from "@nomiclabs/buidler";
import { deployContract, getWallets, solidity } from "ethereum-waffle";
import WrappedCoffeeCoinArtifact from "../artifacts/WrappedCoffeeCoin.json";
import { WrappedCoffeeCoin } from "../typechain/WrappedCoffeeCoin";
import chai from "chai";
import { constants } from "ethers";

chai.use(solidity);
const { expect } = chai;
require("chai").should();

describe("WrappedCoffeeCoin", () => {
  describe("ERC20 Validations", () => {
    const provider = ethers.provider;
    const IPFS_HASH = "QmaoLeVeFjGDGk6mL7JBiEKS9nFvqdEHvmxpXXQGEvySSN";
    let accounts = getWallets(provider);
    let wrappedCoffeeCoin: WrappedCoffeeCoin;

    before(async () => {
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
      decimals.should.be.equal(18);
    });

    it("...should set minter", async () => {
      let coffeeHandler = await wrappedCoffeeCoin.coffeeHandler();
      coffeeHandler.should.be.eq(constants.AddressZero, "address must be initalized empty");
      let wccNotOwner = wrappedCoffeeCoin.connect(accounts[1]);
      await expect(wccNotOwner.setCoffeeHandler(accounts[2].address)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
      await expect(wrappedCoffeeCoin.mint(accounts[0].address, 100000)).to.be.revertedWith(
        "Coffee Handler must be set"
      );
      await wrappedCoffeeCoin.setCoffeeHandler(accounts[2].address);
    });

    it("...should be only minted by Coffee Handler", async () => {
      await expect(wrappedCoffeeCoin.mint(accounts[0].address, 100000)).to.be.revertedWith(
        "MinterRole: caller does not have the Minter role"
      );
    });

    it("...should set the coffee information", async () => {
      let ipfsHash = await wrappedCoffeeCoin.getCoffee();
      ipfsHash.should.eq("", "Hash should be empty");
      let wccNotOwner = wrappedCoffeeCoin.connect(accounts[1]);
      await expect(wccNotOwner.updateCoffee(IPFS_HASH)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
      await expect(wrappedCoffeeCoin.updateCoffee("")).to.be.revertedWith(
        "The IPFS pointer cannot be empty"
      );
      await expect(wrappedCoffeeCoin.updateCoffee(IPFS_HASH))
        .to.emit(wrappedCoffeeCoin, "LogUpdateCoffee")
        .withArgs(accounts[0].address, IPFS_HASH);
      ipfsHash = await wrappedCoffeeCoin.getCoffee();
      ipfsHash.should.eq(IPFS_HASH, "Hash should be updated");
    });
  });
});
