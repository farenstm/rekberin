// =====================================================================
// EscrowChain — Smart Contract Source (Solidity 0.8.20)
// =====================================================================
// Kode ini hanya untuk display di UI / dokumentasi skripsi.
// Akan dideploy ke Polygon Amoy testnet pada tahap implementasi nyata.
// =====================================================================

export const ESCROW_SOLIDITY_SOURCE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title EscrowChain
 * @dev Smart contract escrow untuk marketplace akun game digital.
 *      Implementasi Finite State Machine (FSM) berikut:
 *
 *        NONE ──deposit──▶ DEPOSITED ──hold──▶ HELD ──release──▶ RELEASED
 *                                                │
 *                                                └──refund──▶ REFUNDED
 *
 *      Seller hanya bisa klaim dana setelah buyer konfirmasi penerimaan akun.
 *      Buyer bisa request refund selama masih dalam state HELD.
 *
 *      Dideploy ke Polygon Amoy Testnet (chainId 80002).
 */
contract EscrowChain {
    // ---------- Enums ----------

    enum State {
        NONE,        // 0
        DEPOSITED,   // 1
        HELD,        // 2
        RELEASED,    // 3
        REFUNDED,    // 4
        DISPUTED     // 5
    }

    // ---------- Structs ----------

    struct Listing {
        uint256 id;
        address seller;
        uint256 priceWei;
        bytes32 ipfsCid;       // Hash metadata listing
        State status;          // NONE = available
    }

    struct Escrow {
        uint256 listingId;
        address buyer;
        address seller;
        uint256 amount;
        State state;
        bool buyerConfirmed;
        bool sellerConfirmed;
        uint256 createdAt;
        uint256 updatedAt;
    }

    // ---------- Storage ----------

    address public owner;
    uint256 public listingCounter;
    uint256 public escrowCounter;

    mapping(uint256 => Listing) public listings;
    mapping(uint256 => Escrow) public escrows;

    // ---------- Events ----------

    event ListingCreated(uint256 indexed listingId, address indexed seller, uint256 price, bytes32 cid);
    event EscrowCreated(uint256 indexed escrowId, uint256 indexed listingId, address buyer, uint256 amount);
    event Deposited(uint256 indexed escrowId, address buyer, uint256 amount);
    event Held(uint256 indexed escrowId, address indexed seller);
    event Released(uint256 indexed escrowId, address seller, uint256 buyer, uint256 amount);
    event Refunded(uint256 indexed escrowId, address buyer, uint256 amount);
    event DisputeOpened(uint256 indexed escrowId, address opener);

    // ---------- Modifiers ----------

    modifier onlyBuyer(uint256 _escrowId) {
        require(escrows[_escrowId].buyer == msg.sender, "Not buyer");
        _;
    }

    modifier onlySeller(uint256 _escrowId) {
        require(escrows[_escrowId].seller == msg.sender, "Not seller");
        _;
    }

    modifier inState(uint256 _escrowId, State _state) {
        require(escrows[_escrowId].state == _state, "Invalid state");
        _;
    }

    // ---------- Constructor ----------

    constructor() {
        owner = msg.sender;
    }

    // ---------- Listing ----------

    function createListing(uint256 _priceWei, bytes32 _ipfsCid) external returns (uint256) {
        require(_priceWei > 0, "Price must be > 0");

        listingCounter++;
        listings[listingCounter] = Listing({
            id: listingCounter,
            seller: msg.sender,
            priceWei: _priceWei,
            ipfsCid: _ipfsCid,
            status: State.NONE
        });

        emit ListingCreated(listingCounter, msg.sender, _priceWei, _ipfsCid);
        return listingCounter;
    }

    // ---------- Escrow Flow ----------

    /**
     * @dev Buyer memulai pembelian — deposit dana ke contract.
     *      State: NONE → DEPOSITED
     */
    function createEscrow(uint256 _listingId) external payable returns (uint256) {
        Listing storage listing = listings[_listingId];
        require(listing.seller != msg.sender, "Cannot buy own listing");
        require(msg.value == listing.priceWei, "Wrong amount");

        escrowCounter++;
        escrows[escrowCounter] = Escrow({
            listingId: _listingId,
            buyer: msg.sender,
            seller: listing.seller,
            amount: msg.value,
            state: State.DEPOSITED,
            buyerConfirmed: false,
            sellerConfirmed: false,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });

        listing.status = State.DEPOSITED;

        emit EscrowCreated(escrowCounter, _listingId, msg.sender, msg.value);
        emit Deposited(escrowCounter, msg.sender, msg.value);
        return escrowCounter;
    }

    /**
     * @dev Seller konfirmasi bahwa dia siap mengirim akun.
     *      State: DEPOSITED → HELD
     */
    function confirmHold(uint256 _escrowId)
        external
        onlySeller(_escrowId)
        inState(_escrowId, State.DEPOSITED)
    {
        Escrow storage e = escrows[_escrowId];
        e.sellerConfirmed = true;
        e.state = State.HELD;
        e.updatedAt = block.timestamp;

        emit Held(_escrowId, msg.sender);
    }

    /**
     * @dev Buyer konfirmasi bahwa akun sudah diterima.
     *      Dana dilepas ke seller.
     *      State: HELD → RELEASED
     */
    function confirmReceived(uint256 _escrowId)
        external
        onlyBuyer(_escrowId)
        inState(_escrowId, State.HELD)
    {
        Escrow storage e = escrows[_escrowId];
        e.buyerConfirmed = true;
        e.state = State.RELEASED;
        e.updatedAt = block.timestamp;

        (bool sent, ) = e.seller.call{value: e.amount}("");
        require(sent, "Release failed");

        emit Released(_escrowId, e.seller, e.buyer, e.amount);
    }

    /**
     * @dev Buyer request refund selama dalam state HELD.
     *      Dana dikembalikan ke buyer.
     *      State: HELD → REFUNDED
     */
    function requestRefund(uint256 _escrowId)
        external
        onlyBuyer(_escrowId)
        inState(_escrowId, State.HELD)
    {
        Escrow storage e = escrows[_escrowId];
        e.state = State.REFUNDED;
        e.updatedAt = block.timestamp;

        (bool sent, ) = e.buyer.call{value: e.amount}("");
        require(sent, "Refund failed");

        emit Refunded(_escrowId, e.buyer, e.amount);
    }

    // ---------- Views ----------

    function getEscrowState(uint256 _escrowId) external view returns (State) {
        return escrows[_escrowId].state;
    }
}
`;

export const ESCROW_ABI = [
  {
    name: "createListing",
    type: "function" as const,
    inputs: [
      { name: "_priceWei", type: "uint256" },
      { name: "_ipfsCid", type: "bytes32" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    name: "createEscrow",
    type: "function" as const,
    inputs: [{ name: "_listingId", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "payable",
  },
  {
    name: "confirmHold",
    type: "function" as const,
    inputs: [{ name: "_escrowId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    name: "confirmReceived",
    type: "function" as const,
    inputs: [{ name: "_escrowId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    name: "requestRefund",
    type: "function" as const,
    inputs: [{ name: "_escrowId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    name: "ListingCreated",
    type: "event" as const,
    inputs: [
      { name: "listingId", type: "uint256" },
      { name: "seller", type: "address" },
      { name: "price", type: "uint256" },
      { name: "cid", type: "bytes32" },
    ],
  },
  {
    name: "Deposited",
    type: "event" as const,
    inputs: [
      { name: "escrowId", type: "uint256" },
      { name: "buyer", type: "address" },
      { name: "amount", type: "uint256" },
    ],
  },
  {
    name: "Held",
    type: "event" as const,
    inputs: [
      { name: "escrowId", type: "uint256" },
      { name: "seller", type: "address" },
    ],
  },
  {
    name: "Released",
    type: "event" as const,
    inputs: [
      { name: "escrowId", type: "uint256" },
      { name: "seller", type: "address" },
      { name: "buyer", type: "address" },
      { name: "amount", type: "uint256" },
    ],
  },
  {
    name: "Refunded",
    type: "event" as const,
    inputs: [
      { name: "escrowId", type: "uint256" },
      { name: "buyer", type: "address" },
      { name: "amount", type: "uint256" },
    ],
  },
];

export const CONTRACT_INFO = {
  name: "EscrowChain",
  address: "0xe31BE7F102BEbe58f64FA01fd7aF1f8065c8efde",
  network: "Polygon Amoy Testnet",
  chainId: "0x13882",
  chainIdDecimal: 80002,
  deployBlock: 6_482_517,
  explorerUrl: "https://www.oklink.com/amoy",
  rpcUrl: "https://rpc-amoy.polygon.technology",
  sourceCode: ESCROW_SOLIDITY_SOURCE,
  abi: ESCROW_ABI,
};
