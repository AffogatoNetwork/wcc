import { ethers } from "@nomiclabs/buidler";
const jsonfile = require("jsonfile");

async function main() {
  const coffeeHandlerFactory = await ethers.getContract("CoffeeHandler");
  const wrappedCoffeeCoinFactory = await ethers.getContract("WrappedCoffeeCoin");

  // If we had constructor arguments, they would be passed into deploy()
  let coffeeHandlerContract = await coffeeHandlerFactory.deploy();
  let wrappedCoffeeCoinContract = await wrappedCoffeeCoinFactory.deploy();

  // The address the Contract WILL have once mined
  console.log("TCL: main -> coffeeHandlerContract.address", coffeeHandlerContract.address);
  let file = "build/CoffeeHandler.json";
  let newData = { address: coffeeHandlerContract.address };
  jsonfile.readFile(file, (err: any, oldData: any) => {
    if (err) console.error(err);
    jsonfile.writeFile(file, Object.assign(oldData, newData), (err: any) => {
      if (err) console.error(err);
      else console.log("Contract JSON updated");
    });
  });

  let wccfile = "build/WrappedCoffeeCoin.json";
  newData = { address: wrappedCoffeeCoinContract.address };
  jsonfile.readFile(wccfile, (err: any, oldData: any) => {
    if (err) console.error(err);
    jsonfile.writeFile(wccfile, Object.assign(oldData, newData), (err: any) => {
      if (err) console.error(err);
      else console.log("Contract JSON updated");
    });
  });
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
