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

contract ProductPaymentServiceTest is Test {
    ProductPaymentService paymentService;
    MockERC20 token;
    
    address creator = address(0x1);
    address buyer = address(0x2);
    
    function setUp() public {
        token = new MockERC20();
        paymentService = new ProductPaymentService(address(token));
        token.mint(buyer, 1000 ether);
    }
    
    function test_AddProduct() public {
        vm.prank(creator);
        paymentService.addProduct(1, 100 ether, "nillion://content123");
        
        (uint256 price, address productCreator, string memory contentId, bool exists) = 
            paymentService.getProduct(1);
        
        require(exists, "Product should exist");
        require(price == 100 ether, "Price should match");
        require(productCreator == creator, "Creator should match");
    }
    
    function test_AddProductRevertsOnZeroPrice() public {
        vm.prank(creator);
        vm.expectRevert(ProductPaymentService.InvalidPrice.selector);
        paymentService.addProduct(1, 0, "nillion://content123");
    }
    
    function test_PayForProduct() public {
        // Creator adds product
        vm.prank(creator);
        paymentService.addProduct(1, 100 ether, "nillion://content123");
        
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
        paymentService.addProduct(1, 100 ether, "nillion://content123");
        
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
        paymentService.addProduct(1, 100 ether, "nillion://content123");
        
        vm.prank(buyer);
        vm.expectRevert(ProductPaymentService.OnlyCreatorCanUpdate.selector);
        paymentService.updateProductPrice(1, 200 ether);
    }
}
