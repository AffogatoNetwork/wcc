import { ethers } from 'ethers';
import Web3 from 'web3';

const getWeb3 = () =>
  new Promise((resolve, reject) => {
    // Wait for loading completion to avoid race conditions with web3 injection timing.
    window.addEventListener("load", async () => {
      // Modern dapp browsers...
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        try {
          // Request account access if needed
          await window.ethereum.enable();
          // Acccounts now exposed
          resolve(provider);
        } catch (error) {
          reject(error);
        }
      }
      // Legacy dapp browsers...
      else if (window.web3) {
        // Use Mist/MetaMask's provider.
        const web3 = window.web3;
        const provider = new ethers.providers.Web3Provider(web3.currentProvider);
        resolve(provider);
      }
      // Fallback to localhost; use dev console port by default...
      else {
        let currentProvider = new Web3.providers.HttpProvider('http://localhost:8545');
        let web3Provider = new ethers.providers.Web3Provider(currentProvider);
        console.log("No web3 instance injected, using Local web3.");
        resolve(web3Provider);
      }
    });
  });

export default getWeb3;