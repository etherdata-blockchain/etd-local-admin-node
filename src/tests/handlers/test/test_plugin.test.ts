import { utils } from "@etherdata-blockchain/common";
import { TestHandler } from "../../../internal/handlers/test/test_plugin";

describe("Given a test plugin", () => {
  test("When calling some function", () => {
    const testPlugin = new TestHandler();
    testPlugin.printData();
    testPlugin.printData2();
  });
});
