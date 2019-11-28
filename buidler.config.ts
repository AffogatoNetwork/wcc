require("dotenv").config();
import { BuidlerConfig, usePlugin } from "@nomiclabs/buidler/config";
import waffleDefaultAccounts from "ethereum-waffle/dist/config/defaultAccounts";

usePlugin("@nomiclabs/buidler-ethers");
usePlugin("@nomiclabs/buidler-etherscan");

const mnemonic = process.env.MNENOMIC;

const config: BuidlerConfig = {
  solc: {
    version: "0.5.12"
  },
  //@ts-ignore
  networks: {
    buidlerevm: {
      accounts: waffleDefaultAccounts.map(acc => ({
        balance: acc.balance,
        privateKey: acc.secretKey
      }))
    },
    rinkeby: {
      url: process.env.RINKEBY_API_URL,
      accounts: { mnemonic: mnemonic }
    }
  },
  etherscan: {
    // The url for the Etherscan API you want to use.
    url: "https://api-rinkeby.etherscan.io/api",
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: process.env.ETHERSCAN_API_KEY as string
  }
};

export default config;
