import { TestHandler } from "../../../src/internal/handlers/test/test_plugin";

describe("Given a test plugin", () => {
  test("When calling some function", () => {
    const testPlugin = new TestHandler();
    testPlugin.printData();
    testPlugin.printData2();
  });
});
