const WrappedCoffeeCoin = artifacts.require("WrappedCoffeeCoin");

module.exports = (deployer, network) => {
  if (network == "development") {
    deployer.deploy(WrappedCoffeeCoin);
  }
};
