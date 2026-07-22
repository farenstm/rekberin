import { ethers } from "hardhat";

async function main() {
  const contractAddress = "0x7e8A6F113683D71D391413d32BEDf23F59EA1749";
  const EscrowChain = await ethers.getContractAt("EscrowChain", contractAddress);

  const prices = [
    312.5,
    562.5,
    750,
    218.75,
    468.75,
    156.25
  ];

  for (let i = 0; i < prices.length; i++) {
    const priceWei = ethers.parseEther(prices[i].toString());
    console.log(`Creating listing ${i + 1} with price ${prices[i]} MATIC...`);
    const tx = await EscrowChain.createListing(priceWei, "mock-cid-" + (i + 1));
    await tx.wait();
  }

  console.log("6 mock listings seeded successfully on the smart contract!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
