// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { ProductPaymentService } from "./ProductPaymentService.sol";
import { Test } from "forge-std/Test.sol";

// Mock ERC20 token for testing
contract MockERC20 {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }
    
    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }
    
    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        allowance[from][msg.sender] -= amount;
        return true;
    }
}

contract MockVerifiedList {
    mapping(address => bool) public verified;

    function setVerified(address user, bool value) external {
        verified[user] = value;
    }

    function isOnVerifiedList(address user) external view returns (bool) {
        return verified[user];
    }
}

contract ProductPaymentServiceTest is Test {
    ProductPaymentService paymentService;
    MockERC20 token;
    MockVerifiedList verifiedList;
    
    address creator = address(0x1);
    address buyer = address(0x2);
    
    function setUp() public {
        token = new MockERC20();
        verifiedList = new MockVerifiedList();
        paymentService = new ProductPaymentService(address(token), address(verifiedList));
        token.mint(buyer, 1000 ether);
    }
    
    function test_AddProduct() public {
        vm.prank(creator);
        paymentService.addProduct(1, 100 ether, "nillion://content123", false);
        
        (uint256 price, address productCreator,, bool mustBeVerified, bool exists) = 
            paymentService.getProduct(1);
        
        require(exists, "Product should exist");
        require(price == 100 ether, "Price should match");
        require(productCreator == creator, "Creator should match");
        require(!mustBeVerified, "Should not require verification");
    }
    
    function test_AddProductRevertsOnZeroPrice() public {
        vm.prank(creator);
        vm.expectRevert(ProductPaymentService.InvalidPrice.selector);
        paymentService.addProduct(1, 0, "nillion://content123", false);
    }
    
    function test_PayForProduct() public {
        // Creator adds product
        vm.prank(creator);
        paymentService.addProduct(1, 100 ether, "nillion://content123", false);
        
        // Buyer approves and pays
        vm.prank(buyer);
        token.approve(address(paymentService), 100 ether);
        
        vm.prank(buyer);
        paymentService.payForProduct(1);
        
        // Verify payment
        require(paymentService.hasPaid(buyer, 1), "Buyer should have paid");
        require(token.balanceOf(creator) == 100 ether, "Creator should receive payment");
    }
    
    function test_CannotPayTwice() public {
        vm.prank(creator);
        paymentService.addProduct(1, 100 ether, "nillion://content123", false);
        
        vm.prank(buyer);
        token.approve(address(paymentService), 200 ether);
        
        vm.prank(buyer);
        paymentService.payForProduct(1);
        
        vm.prank(buyer);
        vm.expectRevert(ProductPaymentService.AlreadyPaid.selector);
        paymentService.payForProduct(1);
    }
    
    function test_OnlyCreatorCanUpdatePrice() public {
        vm.prank(creator);
        paymentService.addProduct(1, 100 ether, "nillion://content123", false);
        
        vm.prank(buyer);
        vm.expectRevert(ProductPaymentService.OnlyCreatorCanUpdate.selector);
        paymentService.updateProductPrice(1, 200 ether);
    }

    function test_PayForProductRequiresVerificationWhenFlagged() public {
        vm.prank(creator);
        paymentService.addProduct(1, 100 ether, "nillion://content123", true);

        vm.prank(creator);
        paymentService.addProduct(2, 50 ether, "nillion://content456", false);

        vm.prank(buyer);
        token.approve(address(paymentService), 100 ether);

        vm.prank(buyer);
        vm.expectRevert(bytes("Caller not verified"));
        paymentService.payForProduct(1);

        vm.prank(buyer);
        paymentService.payForProduct(2);
        require(paymentService.hasPaid(buyer, 2), "Unverified buyer should access public product");

        verifiedList.setVerified(buyer, true);

        vm.prank(buyer);
        token.approve(address(paymentService), 100 ether);
        vm.prank(buyer);
        paymentService.payForProduct(1);

        require(paymentService.hasPaid(buyer, 1), "Buyer should have paid after verification");
    }

    function test_VerifiedBuyerCanPurchaseMultipleRestrictedProducts() public {
        vm.prank(creator);
        paymentService.addProduct(1, 100 ether, "nillion://content123", true);
        vm.prank(creator);
        paymentService.addProduct(2, 75 ether, "nillion://content456", true);

        vm.prank(buyer);
        token.approve(address(paymentService), 200 ether);

        vm.prank(buyer);
        vm.expectRevert(bytes("Caller not verified"));
        paymentService.payForProduct(1);

        verifiedList.setVerified(buyer, true);

        vm.prank(buyer);
        paymentService.payForProduct(1);
        vm.prank(buyer);
        paymentService.payForProduct(2);

        require(paymentService.hasPaid(buyer, 1), "Paid product 1");
        require(paymentService.hasPaid(buyer, 2), "Paid product 2");
    }
}
