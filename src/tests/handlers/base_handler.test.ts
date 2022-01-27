import { NodeClient } from "../../node_client/node_client";
import { TestHandler } from "../../internal/handlers/test/test_plugin";

describe("Given a base handler", () => {
  test("When calling start", async () => {
    const newApp = new NodeClient({ handlers: [new TestHandler()] });
    await newApp.startApp();
  });
});
