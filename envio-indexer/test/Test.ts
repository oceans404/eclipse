import assert from "assert";
import { 
  TestHelpers,
  ProductPaymentService_PaymentReceived
} from "generated";
const { MockDb, ProductPaymentService } = TestHelpers;

describe("ProductPaymentService contract PaymentReceived event tests", () => {
  // Create mock db
  const mockDb = MockDb.createMockDb();

  // Creating mock for ProductPaymentService contract PaymentReceived event
  const event = ProductPaymentService.PaymentReceived.createMockEvent({/* It mocks event fields with default values. You can overwrite them if you need */});

  it("ProductPaymentService_PaymentReceived is created correctly", async () => {
    // Processing the event
    const mockDbUpdated = await ProductPaymentService.PaymentReceived.processEvent({
      event,
      mockDb,
    });

    // Getting the actual entity from the mock database
    let actualProductPaymentServicePaymentReceived = mockDbUpdated.entities.ProductPaymentService_PaymentReceived.get(
      `${event.chainId}_${event.block.number}_${event.logIndex}`
    );

    // Creating the expected entity
    const expectedProductPaymentServicePaymentReceived: ProductPaymentService_PaymentReceived = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      payer: event.params.payer,
      productId: event.params.productId,
      amount: event.params.amount,
    };
    // Asserting that the entity in the mock database is the same as the expected entity
    assert.deepEqual(actualProductPaymentServicePaymentReceived, expectedProductPaymentServicePaymentReceived, "Actual ProductPaymentServicePaymentReceived should be the same as the expectedProductPaymentServicePaymentReceived");
  });
});
