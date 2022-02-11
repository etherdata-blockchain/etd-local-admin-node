import * as fs from "fs";
import { CoinbaseHandler } from "../../src/internal/utils/command";

jest.mock("fs");
jest.mock("chalk");

test("Test env", async () => {
  // @ts-ignore
  fs.readFileSync.mockReturnValue(Buffer.from("etd_coinbase=a"));
  const coinbaseHandler = new CoinbaseHandler();
  const newEnv = await coinbaseHandler.handle({
    command: "",
    data: { newCoinbase: "abcde" },
  });
  expect(newEnv).toBe("etd_coinbase=abcde\n");
});

test("Test env when coinbase doesn't exist", async () => {
  // @ts-ignore
  fs.readFileSync.mockReturnValue(Buffer.from("node_name=a"));
  const coinbaseHandler = new CoinbaseHandler();
  const newEnv = await coinbaseHandler.handle({
    command: "",
    data: { newCoinbase: "abcde" },
  });
  expect(newEnv).toBe("node_name=a\netd_coinbase=abcde\n");
});
