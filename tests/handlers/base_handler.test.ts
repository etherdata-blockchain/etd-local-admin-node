import { NodeClient } from "../../src/node_client/node_client";
import { TestHandler } from "../../src/internal/handlers/test/test_plugin";

describe("Given a base handler", () => {
  test("When calling start", async () => {
    const newApp = new NodeClient({ handlers: [new TestHandler()] });
    await newApp.startApp();
  });
});
