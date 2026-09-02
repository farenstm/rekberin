// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract EscrowChain is ReentrancyGuard {
    enum EscrowState { HELD, RELEASED, REFUND_REQUESTED, REFUNDED }

    struct Listing {
        uint256 id;
        address payable seller;
        uint256 price;
        string cid;
        bool isActive;
    }

    struct Escrow {
        uint256 id;
        uint256 listingId;
        address payable buyer;
        address payable seller;
        uint256 amount;
        EscrowState state;
        uint256 createdAt;
        uint256 updatedAt;
    }

    uint256 public nextListingId = 1;
    uint256 public nextEscrowId = 1;

    mapping(uint256 => Listing) public listings;
    mapping(uint256 => Escrow) public escrows;

    event ListingCreated(uint256 indexed listingId, address indexed seller, uint256 price, string cid);
    event ListingUpdated(uint256 indexed listingId, uint256 newPrice, string newCid);
    event ListingCancelled(uint256 indexed listingId);
    event EscrowCreated(uint256 indexed escrowId, uint256 indexed listingId, address indexed buyer, address seller, uint256 amount);
    event EscrowStateChanged(
        uint256 indexed escrowId,
        EscrowState oldState,
        EscrowState newState
    );

    function createListing(uint256 _price, string memory _cid) external {
        require(_price > 0, "Price must be greater than 0");
        require(bytes(_cid).length > 0, "CID required");
        uint256 listingId = nextListingId++;

        listings[listingId] = Listing({
            id: listingId,
            seller: payable(msg.sender),
            price: _price,
            cid: _cid,
            isActive: true
        });

        emit ListingCreated(listingId, msg.sender, _price, _cid);
    }

    function updateListing(uint256 _listingId, uint256 _newPrice, string memory _newCid) external {
        Listing storage listing = listings[_listingId];
        require(listing.id != 0, "Listing not found");
        require(listing.seller == msg.sender, "Only seller can update listing");
        require(listing.isActive, "Listing is not active");
        require(_newPrice > 0, "Price must be greater than 0");
        require(bytes(_newCid).length > 0, "CID required");

        listing.price = _newPrice;
        listing.cid = _newCid;

        emit ListingUpdated(_listingId, _newPrice, _newCid);
    }

    function cancelListing(uint256 _listingId) external {
        Listing storage listing = listings[_listingId];
        require(listing.id != 0, "Listing not found");
        require(listing.seller == msg.sender, "Only seller can cancel listing");
        require(listing.isActive, "Listing is not active or already in escrow");

        listing.isActive = false;
        emit ListingCancelled(_listingId);
    }

    function createEscrow(uint256 _listingId) external payable {
        Listing storage listing = listings[_listingId];
        require(listing.id != 0, "Listing not found");
        require(listing.isActive, "Listing is not active");
        require(msg.value == listing.price, "Incorrect MATIC value sent");
        require(msg.sender != listing.seller, "Seller cannot buy own listing");

        uint256 escrowId = nextEscrowId++;
        
        escrows[escrowId] = Escrow({
            id: escrowId,
            listingId: _listingId,
            buyer: payable(msg.sender),
            seller: listing.seller,
            amount: msg.value,
            state: EscrowState.HELD,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });

        listing.isActive = false;

        emit EscrowCreated(escrowId, _listingId, msg.sender, listing.seller, msg.value);
    }

    function confirmReceipt(uint256 _escrowId) external nonReentrant {
        Escrow storage escrow = escrows[_escrowId];
        require(escrow.buyer == msg.sender, "Only buyer can confirm receipt");
        require(escrow.state == EscrowState.HELD, "Escrow is not HELD");

        EscrowState oldState = escrow.state;
        escrow.state = EscrowState.RELEASED;
        escrow.updatedAt = block.timestamp;
        
        (bool success, ) = escrow.seller.call{value: escrow.amount}("");
        require(success, "Transfer failed");

        emit EscrowStateChanged(_escrowId, oldState, EscrowState.RELEASED);
    }

    function requestRefund(uint256 _escrowId) external {
        Escrow storage escrow = escrows[_escrowId];
        require(escrow.buyer == msg.sender, "Only buyer can request refund");
        require(escrow.state == EscrowState.HELD, "Escrow is not HELD");

        EscrowState oldState = escrow.state;
        escrow.state = EscrowState.REFUND_REQUESTED;
        escrow.updatedAt = block.timestamp;

        emit EscrowStateChanged(_escrowId, oldState, EscrowState.REFUND_REQUESTED);
    }

    function approveRefund(uint256 _escrowId) external nonReentrant {
        Escrow storage escrow = escrows[_escrowId];
        require(escrow.seller == msg.sender, "Only seller can approve refund");
        require(escrow.state == EscrowState.REFUND_REQUESTED, "Refund not requested");

        EscrowState oldState = escrow.state;
        escrow.state = EscrowState.REFUNDED;
        escrow.updatedAt = block.timestamp;
        
        (bool success, ) = escrow.buyer.call{value: escrow.amount}("");
        require(success, "Transfer failed");

        emit EscrowStateChanged(_escrowId, oldState, EscrowState.REFUNDED);
    }

    function rejectRefund(uint256 _escrowId) external {
        Escrow storage escrow = escrows[_escrowId];
        require(escrow.seller == msg.sender, "Only seller can reject refund");
        require(escrow.state == EscrowState.REFUND_REQUESTED, "Refund not requested");

        EscrowState oldState = escrow.state;

        escrow.state = EscrowState.HELD;
        escrow.updatedAt = block.timestamp;

        emit EscrowStateChanged(_escrowId, oldState, EscrowState.HELD);
    }

    function getEscrow(uint256 _id) external view returns (Escrow memory) {
        return escrows[_id];
    }

    function getListing(uint256 _id) external view returns (Listing memory) {
        return listings[_id];
    }
}
