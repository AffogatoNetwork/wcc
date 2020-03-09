require("dotenv").config();
import { BuidlerConfig, usePlugin } from "@nomiclabs/buidler/config";

usePlugin("@nomiclabs/buidler-waffle");
usePlugin("@nomiclabs/buidler-etherscan");

const mnemonic = process.env.MNENOMIC as string;

const config: BuidlerConfig = {
  solc: {
    version: "0.5.12"
  },
  //@ts-ignore
  networks: {
    buidlerevm: {
      // accounts: waffleDefaultAccounts.map(acc => ({
      //   balance: acc.balance,
      //   privateKey: acc.secretKey
      // }))
    },
    rinkeby: {
      url: process.env.RINKEBY_API_URL,
      accounts: { mnemonic: mnemonic }
    },
    kovan: {
      url: process.env.KOVAN_API_URL,
      accounts: { mnemonic: mnemonic }
    },
    mainnet: {
      url: process.env.MAIN_API_URL,
      accounts: { mnemonic: mnemonic }
    }
  },
  etherscan: {
    // The url for the Etherscan API you want to use.
    url: process.env.ETHERSCAN_URL as string,
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: process.env.ETHERSCAN_API_KEY as string
  }
};

export default config;
