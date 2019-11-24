require("dotenv").config();
import { BuidlerConfig, usePlugin } from "@nomiclabs/buidler/config";
import waffleDefaultAccounts from "ethereum-waffle/dist/config/defaultAccounts";

usePlugin("@nomiclabs/buidler-ethers");

const mnemonic = process.env.MNENOMIC;

const config: BuidlerConfig = {
  solc: {
    version: "0.5.12"
  },
  paths: {
    artifacts: "./build"
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
  }
};

export default config;
