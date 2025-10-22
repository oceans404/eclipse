/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
import {
  ProductPaymentService,
  ProductPaymentService_PaymentReceived,
  ProductPaymentService_ProductAdded,
  ProductPaymentService_ProductUpdated,
  Product,
} from 'generated';

ProductPaymentService.PaymentReceived.handler(async ({ event, context }) => {
  const entity: ProductPaymentService_PaymentReceived = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    payer: event.params.payer,
    productId: event.params.productId,
    amount: event.params.amount,
  };

  context.ProductPaymentService_PaymentReceived.set(entity);
});

ProductPaymentService.ProductAdded.handler(async ({ event, context }) => {
  // Store the event (historical record)
  const entity: ProductPaymentService_ProductAdded = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    productId: event.params.productId,
    price: event.params.price,
    creator: event.params.creator,
    contentId: event.params.contentId,
  };

  context.ProductPaymentService_ProductAdded.set(entity);

  // Create the Product entity (current state)
  const product: Product = {
    id: event.params.productId.toString(),
    productId: event.params.productId,
    currentPrice: event.params.price,
    creator: event.params.creator,
    contentId: event.params.contentId,
    createdAt: BigInt(event.block.timestamp),
    lastUpdatedAt: BigInt(event.block.timestamp),
    updateCount: 0,
  };

  context.Product.set(product);
});

ProductPaymentService.ProductUpdated.handler(async ({ event, context }) => {
  // Store the update event (historical record)
  const entity: ProductPaymentService_ProductUpdated = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    productId: event.params.productId,
    newPrice: event.params.newPrice,
  };

  context.ProductPaymentService_ProductUpdated.set(entity);

  // Update the Product entity with new current price
  const product = await context.Product.get(event.params.productId.toString());

  if (product) {
    const updatedProduct: Product = {
      ...product,
      currentPrice: event.params.newPrice,
      lastUpdatedAt: BigInt(event.block.timestamp),
      updateCount: product.updateCount + 1,
    };

    context.Product.set(updatedProduct);
  }
});
