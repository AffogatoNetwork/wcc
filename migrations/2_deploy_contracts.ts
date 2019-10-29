const WrappedCoffeeCoinArtifact = artifacts.require("WrappedCoffeeCoin");
const CoffeeHandlerArtifact = artifacts.require("CoffeeHandler");

module.exports = (deployer: any, network: string) => {
  if (network == "development") {
    deployer.deploy(WrappedCoffeeCoin);
    deployer.deploy(CoffeeHandler);
  }
};
