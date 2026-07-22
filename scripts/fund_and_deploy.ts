import { ethers } from "hardhat";

async function main() {
  const signers = await ethers.getSigners();
  const deployer = signers[0]; // This will be the user's wallet if PRIVATE_KEY is set
  const richAccount = signers[1]; // Hardhat's default account (if user's wallet is signers[0])

  console.log("Preparing to deploy with account:", deployer.address);

  // Fund the deployer account if it doesn't have enough ETH in localhost
  const balance = await ethers.provider.getBalance(deployer.address);
  if (balance < ethers.parseEther("1.0")) {
    console.log("Account has low balance on localhost. Funding from Hardhat rich account...");
    // When a custom private key is provided in hardhat.config.ts for localhost, 
    // it replaces the default accounts. We need to fund it using the JSON-RPC provider directly.
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    // Hardhat rich account #0 private key
    const richWallet = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider);
    
    const tx = await richWallet.sendTransaction({
      to: deployer.address,
      value: ethers.parseEther("10.0"),
    });
    await tx.wait();
    console.log("Funded 10 ETH to deployer account!");
  }

  console.log("Deploying EscrowChain...");
  const EscrowChain = await ethers.getContractFactory("EscrowChain", deployer);
  const escrow = await EscrowChain.deploy();
  await escrow.waitForDeployment();

  console.log("==========================================");
  console.log("EscrowChain deployed successfully!");
  console.log("Contract Address (CA):", await escrow.getAddress());
  console.log("Deployed by (Owner):", deployer.address);
  console.log("==========================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
