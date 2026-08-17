const { ethers } = require('ethers');
const provider = new ethers.JsonRpcProvider('https://polygon-amoy-bor-rpc.publicnode.com');
const contract = new ethers.Contract('0x1eCB0A2Ad4495a1B050B519b6ACe92B1e068Bf92', [
  'event EscrowCreated(uint256 indexed escrowId, uint256 indexed listingId, address indexed buyer, address seller, uint256 amount)'
], provider);

async function findTx() {
  let toBlock = 44700000;
  
  while(toBlock > 6482517) {
    const fromBlock = toBlock - 9999;
    try {
      const logs = await contract.queryFilter('EscrowCreated', fromBlock, toBlock);
      for (const log of logs) {
        console.log(`Found Escrow #${log.args[0]} at TX: ${log.transactionHash}`);
        if (Number(log.args[0]) === 3) {
            console.log('Found #3, stopping.');
            return;
        }
      }
    } catch(err) {
      console.log('Error chunk', fromBlock, toBlock);
    }
    toBlock -= 10000;
  }
}
findTx();
