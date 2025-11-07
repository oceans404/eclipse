// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title NilccVerifiedList
 * @notice Two-tier access control list that pairs verified wallet addresses with unique identifiers.
 * Managers (appointed by the owner) can append new verifications while the owner focuses on access governance.
 */
contract NilccVerifiedList {
    address public owner;
    mapping(address => bool) public managers;

    // Wallet => identifier (0 means not verified)
    mapping(address => uint256) public verifiedList;
    // Identifier => wallet (address(0) means unused)
    mapping(uint256 => address) public identifierToAddress;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event ManagerAdded(address indexed manager);
    event ManagerRemoved(address indexed manager);
    event AddressVerified(address indexed verifiedAddress, uint256 indexed identifier, address indexed addedBy);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyManager() {
        require(managers[msg.sender], "Only managers can call this function");
        _;
    }

    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        address previousOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(previousOwner, newOwner);
    }

    function addManager(address manager) external onlyOwner {
        require(manager != address(0), "Cannot add zero address as manager");
        require(!managers[manager], "Address is already a manager");
        managers[manager] = true;
        emit ManagerAdded(manager);
    }

    function removeManager(address manager) external onlyOwner {
        require(managers[manager], "Address is not a manager");
        managers[manager] = false;
        emit ManagerRemoved(manager);
    }

    function addToVerifiedList(address verifiedAddress, uint256 identifier) external onlyManager {
        require(verifiedAddress != address(0), "Cannot verify zero address");
        require(identifier != 0, "Identifier cannot be zero");
        require(verifiedList[verifiedAddress] == 0, "Wallet address already verified");
        require(identifierToAddress[identifier] == address(0), "Identifier already used");

        verifiedList[verifiedAddress] = identifier;
        identifierToAddress[identifier] = verifiedAddress;

        emit AddressVerified(verifiedAddress, identifier, msg.sender);
    }

    function isOnVerifiedList(address addressToCheck) external view returns (bool) {
        return verifiedList[addressToCheck] != 0;
    }

    function getIdentifier(address addressToCheck) external view returns (uint256) {
        return verifiedList[addressToCheck];
    }

    function getAddress(uint256 identifier) external view returns (address) {
        return identifierToAddress[identifier];
    }

    function isManager(address addressToCheck) external view returns (bool) {
        return managers[addressToCheck];
    }
}

