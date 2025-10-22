/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
import {
  ProductPaymentService,
  ProductPaymentService_PaymentReceived,
  ProductPaymentService_ProductAdded,
  ProductPaymentService_ProductUpdated,
} from "generated";

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
  const entity: ProductPaymentService_ProductAdded = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    productId: event.params.productId,
    price: event.params.price,
    creator: event.params.creator,
    contentId: event.params.contentId,
  };

  context.ProductPaymentService_ProductAdded.set(entity);
});

ProductPaymentService.ProductUpdated.handler(async ({ event, context }) => {
  const entity: ProductPaymentService_ProductUpdated = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    productId: event.params.productId,
    newPrice: event.params.newPrice,
  };

  context.ProductPaymentService_ProductUpdated.set(entity);
});
