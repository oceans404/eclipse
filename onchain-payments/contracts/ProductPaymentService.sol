// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IERC20 {
    function transfer(address recipient, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

interface IVerifiedList {
    function isOnVerifiedList(address addressToCheck) external view returns (bool);
}

/**
 * @title ProductPaymentService
 * @dev A payment service contract for managing one-time payments for products using a specific ERC20 token
 */
contract ProductPaymentService {
    // Custom errors
    error ProductAlreadyExists();
    error ProductDoesNotExist();
    error InvalidPrice();
    error AlreadyPaid();
    error OnlyCreatorCanUpdate();
    error InvalidTokenAddress();
    error InvalidContentId();
    error TokenTransferFailed();
    error InvalidVerifiedListAddress();
    
    // Hardcoded ERC20 token address
    IERC20 public immutable paymentToken;
    IVerifiedList public immutable verifiedList;
    
    // Product structure
    struct Product {
        uint256 price;      // Price in tokens (with token decimals)
        address creator;    // Address of the content creator
        string contentId;   // Reference to content in Nillion storage
        bool mustBeVerified; // Whether buyer must be on NilccVerifiedList
        bool exists;        // Whether this product exists
    }
    
    // Mapping from product ID to Product details
    mapping(uint256 => Product) public products;
    
    // Mapping from address to product ID to payment status
    mapping(address => mapping(uint256 => bool)) public hasPaid;
    
    // Events
    event ProductAdded(uint256 indexed productId, uint256 price, address indexed creator, string contentId, bool mustBeVerified);
    event ProductUpdated(uint256 indexed productId, uint256 newPrice);
    event PaymentReceived(address indexed payer, uint256 indexed productId, uint256 amount);
    
    // Modifiers
    modifier productExists(uint256 productId) {
        if (!products[productId].exists) revert ProductDoesNotExist();
        _;
    }
    
    /**
     * @dev Constructor sets the payment token address
     * @param _paymentToken Address of the ERC20 token to be used for payments
     */
    constructor(address _paymentToken, address _verifiedList) {
        if (_paymentToken == address(0)) revert InvalidTokenAddress();
        if (_verifiedList == address(0)) revert InvalidVerifiedListAddress();
        paymentToken = IERC20(_paymentToken);
        verifiedList = IVerifiedList(_verifiedList);
    }
    
    /**
     * @dev Add a new product with a specified price
     * @param productId Unique identifier for the product
     * @param price Price in tokens (remember to account for token decimals)
     * @param contentId Reference to the content in Nillion storage
     */
    function addProduct(uint256 productId, uint256 price, string memory contentId, bool mustBeVerified) external {
        if (products[productId].exists) revert ProductAlreadyExists();
        if (price == 0) revert InvalidPrice();
        if (bytes(contentId).length == 0) revert InvalidContentId();
        
        products[productId] = Product({
            price: price,
            creator: msg.sender,
            contentId: contentId,
            mustBeVerified: mustBeVerified,
            exists: true
        });
        
        emit ProductAdded(productId, price, msg.sender, contentId, mustBeVerified);
    }
    
    /**
     * @dev Update the price of an existing product (only by creator)
     * @param productId The product to update
     * @param newPrice New price in tokens
     */
    function updateProductPrice(uint256 productId, uint256 newPrice) external productExists(productId) {
        if (products[productId].creator != msg.sender) revert OnlyCreatorCanUpdate();
        if (newPrice == 0) revert InvalidPrice();
        
        products[productId].price = newPrice;
        
        emit ProductUpdated(productId, newPrice);
    }
    
    /**
     * @dev Pay for a product - payment goes directly to the creator
     * @param productId The product to pay for
     */
    function payForProduct(uint256 productId) external productExists(productId) {
        if (hasPaid[msg.sender][productId]) revert AlreadyPaid();
        
        Product memory product = products[productId];

        if (product.mustBeVerified) {
            require(
                verifiedList.isOnVerifiedList(msg.sender),
                "Caller not verified"
            );
        }
        
        // Transfer tokens from buyer directly to creator
        if (!paymentToken.transferFrom(msg.sender, product.creator, product.price)) {
            revert TokenTransferFailed();
        }
        
        // Mark as paid
        hasPaid[msg.sender][productId] = true;
        
        emit PaymentReceived(msg.sender, productId, product.price);
    }
    
    /**
     * @dev Check if an address has paid for a product
     * @param payer Address to check
     * @param productId Product to check
     * @return bool Whether the address has paid
     */
    function hasUserPaid(address payer, uint256 productId) external view returns (bool) {
        return hasPaid[payer][productId];
    }
    
    /**
     * @dev Get product details
     * @param productId Product to query
     * @return price The price of the product
     * @return creator The address of the creator
     * @return contentId The content ID in Nillion storage
     * @return mustBeVerified Whether buyers must be on the verified list
     * @return exists Whether the product exists
     */
    function getProduct(uint256 productId) external view returns (
        uint256 price, 
        address creator, 
        string memory contentId,
        bool mustBeVerified,
        bool exists
    ) {
        Product memory product = products[productId];
        return (product.price, product.creator, product.contentId, product.mustBeVerified, product.exists);
    }
    
    /**
     * @dev Get the token balance of this contract (should always be 0 since payments go directly to creators)
     * @return uint256 The token balance
     */
    function getContractBalance() external view returns (uint256) {
        return paymentToken.balanceOf(address(this));
    }
}
