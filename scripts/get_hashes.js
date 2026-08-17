const { ethers } = require('ethers');
const provider = new ethers.JsonRpcProvider('https://polygon-amoy-bor-rpc.publicnode.com');
const contract = new ethers.Contract('0x1eCB0A2Ad4495a1B050B519b6ACe92B1e068Bf92', [
  'event ListingCreated(uint256 indexed listingId, address indexed seller, uint256 price, string cid)',
  'event EscrowCreated(uint256 indexed escrowId, uint256 indexed listingId, address indexed buyer, address seller, uint256 amount)',
  'event EscrowStateChanged(uint256 indexed escrowId, uint8 oldState, uint8 newState)'
], provider);

async function main() {
  console.log('Fetching logs...');
  const currentBlock = await provider.getBlockNumber();
  let toBlock = currentBlock;
  
  let createListingHash = '';
  let createEscrowHash = '';
  let confirmReceiptHash = '';
  let requestRefundHash = '';
  let approveRefundHash = '';
  let rejectRefundHash = '';

  while (toBlock > currentBlock - 500000) {
    const fromBlock = toBlock - 9999;
    try {
      if (!createListingHash) {
        const logs = await contract.queryFilter('ListingCreated', fromBlock, toBlock);
        if (logs.length > 0) createListingHash = logs[logs.length - 1].transactionHash;
      }
      if (!createEscrowHash) {
        const logs = await contract.queryFilter('EscrowCreated', fromBlock, toBlock);
        if (logs.length > 0) createEscrowHash = logs[logs.length - 1].transactionHash;
      }
      
      const stateLogs = await contract.queryFilter('EscrowStateChanged', fromBlock, toBlock);
      for (let i = stateLogs.length - 1; i >= 0; i--) {
        const log = stateLogs[i];
        const oldState = Number(log.args[1]);
        const newState = Number(log.args[2]);
        if (oldState === 0 && newState === 1 && !confirmReceiptHash) confirmReceiptHash = log.transactionHash;
        if (oldState === 0 && newState === 2 && !requestRefundHash) requestRefundHash = log.transactionHash;
        if (oldState === 2 && newState === 3 && !approveRefundHash) approveRefundHash = log.transactionHash;
        if (oldState === 2 && newState === 0 && !rejectRefundHash) rejectRefundHash = log.transactionHash;
      }
      
      if (createListingHash && createEscrowHash && confirmReceiptHash && requestRefundHash && approveRefundHash && rejectRefundHash) {
          break; // found all
      }
    } catch(err) {
      console.log('Error chunk', fromBlock, toBlock, err.message);
    }
    toBlock -= 10000;
  }
  
  console.log('createListing hash:', createListingHash || 'not found');
  console.log('createEscrow hash:', createEscrowHash || 'not found');
  console.log('confirmReceipt hash:', confirmReceiptHash || 'not found');
  console.log('requestRefund hash:', requestRefundHash || 'not found');
  console.log('approveRefund hash:', approveRefundHash || 'not found');
  console.log('rejectRefund hash:', rejectRefundHash || 'not found');
}

main().catch(console.error);
