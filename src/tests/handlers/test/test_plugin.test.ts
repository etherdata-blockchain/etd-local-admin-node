import { TestHandler } from "../../../internal/handlers/test/test_plugin";

describe("Given a test plugin", () => {
  test("When calling some function", async () => {
    const testPlugin = new TestHandler();
    await testPlugin.printData();
    await testPlugin.printData2();
  });
});
