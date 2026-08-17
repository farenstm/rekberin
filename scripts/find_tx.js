const { ethers } = require('ethers');
const provider = new ethers.JsonRpcProvider('https://polygon-amoy-bor-rpc.publicnode.com');
const contract = new ethers.Contract('0x1eCB0A2Ad4495a1B050B519b6ACe92B1e068Bf92', [
  'event EscrowCreated(uint256 indexed escrowId, uint256 indexed listingId, address indexed buyer, address seller, uint256 amount)'
], provider);

async function findTx() {
  const currentBlock = await provider.getBlockNumber();
  console.log('Current block:', currentBlock);
  const startBlock = 44700000;
  
  for(let i=0; i<10; i++) {
    const from = startBlock + i*10000;
    const to = from + 9999;
    if (from > currentBlock) break;
    
    try {
      const logs = await contract.queryFilter('EscrowCreated', from, to);
      for (const log of logs) {
        console.log(`Found Escrow #${log.args[0]} at TX: ${log.transactionHash}`);
      }
    } catch(err) {
      console.log('Error chunk', from, to);
    }
  }
}
findTx();
