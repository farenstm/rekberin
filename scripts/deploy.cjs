const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const EscrowChain = await ethers.getContractFactory("EscrowChain");
  const escrow = await EscrowChain.deploy();
  await escrow.waitForDeployment();

  console.log("EscrowChain deployed to:", await escrow.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
