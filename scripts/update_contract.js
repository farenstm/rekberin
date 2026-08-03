const fs = require('fs');
const source = fs.readFileSync('contracts/EscrowChain.sol', 'utf8');
const artifact = JSON.parse(fs.readFileSync('artifacts/contracts/EscrowChain.sol/EscrowChain.json', 'utf8'));
const address = '0x1eCB0A2Ad4495a1B050B519b6ACe92B1e068Bf92';

const content = `// =====================================================================
// EscrowChain — Smart Contract Source (Solidity 0.8.28)
// =====================================================================
// Kode ini hanya untuk display di UI / dokumentasi skripsi.
// Akan dideploy ke Polygon Amoy testnet pada tahap implementasi nyata.
// =====================================================================

export const ESCROW_SOLIDITY_SOURCE = \`${source.replace(/`/g, '\\`')}\`;

export const ESCROW_ABI = ${JSON.stringify(artifact.abi, null, 2)} as const;

export const CONTRACT_INFO = {
  name: "EscrowChain",
  address: "${address}",
  network: "Polygon Amoy Testnet",
  chainId: "0x13882",
  chainIdDecimal: 80002,
  deployBlock: 6482517,
  explorerUrl: "https://www.oklink.com/amoy",
  rpcUrl: "https://polygon-amoy-bor-rpc.publicnode.com",
  sourceCode: ESCROW_SOLIDITY_SOURCE,
  abi: ESCROW_ABI,
};
`;
fs.writeFileSync('src/lib/contract.ts', content);
console.log('contract.ts updated!');
