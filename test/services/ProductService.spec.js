const mockQuery = jest.fn();
jest.mock("pg", () => ({
  Client: jest.fn(() => ({
    connect: jest.fn(),
    query: mockQuery,
    end: jest.fn(),
  })),
}));
jest.mock("../../src/services/PublisherService", () => ({
  publishEvent: jest.fn(),
}));
jest.mock("../../src/services/InventoryService", () => ({}));
jest.mock("../../src/services/StorageService", () => ({}));

describe("ProductService", () => {
  const { publishEvent } = require("../../src/services/PublisherService");
  const { createProduct } = require("../../src/services/ProductService");

  beforeEach(() => {
    mockQuery.mockReset();
    publishEvent.mockReset();
  });

  it("should publish a product_created event with all product fields", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 1 }] });

    await createProduct({
      name: "Test Product",
      upc: "100000000001",
      price: 100,
      description: "Test product description",
    });

    expect(publishEvent).toHaveBeenCalledWith("products", {
      action: "product_created",
      id: 1,
      name: "Test Product",
      upc: "100000000001",
      price: 100,
      description: "Test product description",
    });
  });

  it("should not publish an event when the UPC already exists", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });

    await expect(
      createProduct({
        name: "Test Product",
        upc: "100000000001",
        price: 100,
        description: "Test product description",
      }),
    ).rejects.toThrow("Product with this UPC already exists");

    expect(publishEvent).not.toHaveBeenCalled();
  });
});
