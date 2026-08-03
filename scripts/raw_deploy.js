require('dotenv').config();
const { ethers } = require("ethers");
const fs = require('fs');

async function main() {
  const provider = new ethers.JsonRpcProvider("https://polygon-amoy-bor-rpc.publicnode.com");
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  console.log("Deploying contracts with the account:", wallet.address);

  const artifact = JSON.parse(fs.readFileSync('artifacts/contracts/EscrowChain.sol/EscrowChain.json', 'utf8'));
  
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  const escrow = await factory.deploy();
  await escrow.waitForDeployment();

  console.log("EscrowChain deployed to:", await escrow.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
