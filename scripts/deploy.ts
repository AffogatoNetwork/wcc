import { ethers } from "@nomiclabs/buidler";

async function main() {
  const coffeeHandlerFactory = await ethers.getContract("CoffeeHandler");
  const wrappedCoffeeCoinFactory = await ethers.getContract("WrappedCoffeeCoin");

  // If we had constructor arguments, they would be passed into deploy()
  let coffeeHandlerContract = await coffeeHandlerFactory.deploy();
  let wrappedCoffeeCoinContract = await wrappedCoffeeCoinFactory.deploy();

  // The address the Contract WILL have once mined
  console.log("TCL: main -> coffeeHandlerContract.address", coffeeHandlerContract.address);

  // The transaction that was sent to the network to deploy the Contract
  console.log(
    "TCL: main -> coffeeHandlerContract.deployTransaction.hash",
    coffeeHandlerContract.deployTransaction.hash
  );

  // The address the Contract WILL have once mined
  console.log("TCL: main -> wrappedCoffeeCoinContract.address", wrappedCoffeeCoinContract.address);

  // The transaction that was sent to the network to deploy the Contract
  console.log(
    "TCL: main -> wrappedCoffeeCoinContract.deployTransaction.hash",
    wrappedCoffeeCoinContract.deployTransaction.hash
  );

  // The contract is NOT deployed yet; we must wait until it is mined
  await coffeeHandlerContract.deployed();

  // The contract is NOT deployed yet; we must wait until it is mined
  await wrappedCoffeeCoinContract.deployed();
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
