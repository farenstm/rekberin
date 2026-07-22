import { ethers, network } from "hardhat";

async function main() {
  const signers = await ethers.getSigners();
  // Target the custom private key address from .env
  const userWallet = signers[0];
  
  const amountHex = ethers.toBeHex(ethers.parseEther("1000"));
  
  console.log("Adding 1000 ETH to", userWallet.address);
  
  await network.provider.send("hardhat_setBalance", [
    userWallet.address,
    amountHex,
  ]);
  
  const newBalance = await ethers.provider.getBalance(userWallet.address);
  console.log("New Balance:", ethers.formatEther(newBalance), "ETH");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
