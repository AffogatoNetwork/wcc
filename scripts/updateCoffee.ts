const axios = require("axios");
const ethers = require("ethers");
require("dotenv").config();
import { ethers as ethersBuidler } from "@nomiclabs/buidler";
import coffeeData from "./coffee-data.json";
import { WrappedCoffeeCoin } from "../typechain/WrappedCoffeeCoin";

async function main() {
  const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;
  const response = await axios.post(url, coffeeData, {
    headers: {
      pinata_api_key: process.env.PINATA_API_KEY,
      pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY
    }
  });
  if (response.status == 200) {
    console.log("Coffee Data Uploaded");
    console.log(`IPFS Returning Hash: ${response.data.IpfsHash}`);
    let WrappedCoffeeCoinFactory = await ethersBuidler.getContract("WrappedCoffeeCoin");
    let abi = WrappedCoffeeCoinFactory.interface;
    let contractAddress = process.env.WCC_ADDRESS;
    if (contractAddress) {
      let wcc = new ethers.Contract(
        contractAddress,
        abi,
        WrappedCoffeeCoinFactory.signer
      ) as WrappedCoffeeCoin;
      let result = await wcc.updateCoffee(response.data.IpfsHash);
      console.log(`Coffee Info Updated Successfully, Transaction Hash => ${result.hash}`);
    } else {
      console.log("WCC Contract Address not defined");
    }
  } else {
    console.log("Couldn't upload file to IPFS");
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
