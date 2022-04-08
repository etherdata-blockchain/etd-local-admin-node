import * as fs from "fs";
import { StatusHandler } from "../../../src/internal/handlers/status/status_handler";
import { RemoteAdminClient } from "../../../src/internal/remote_client";

jest.mock("../../../src/internal/remote_client", () => ({
  RemoteAdminClient: jest.fn().mockImplementation(function () {
    this.emit = jest.fn(() => ({ key: "abcde" }));
  }),
}));
jest.mock("fs");
jest.mock("dockerode");
jest.mock("web3-eth-admin");
jest.mock(
  "web3",
  () =>
    function () {
      return {
        eth: {
          getBlockNumber: () => 10,
          getBlock: () => ({}),
          getNodeInfo: async () => "getd:1.1.1",
          net: {
            getPeerCount: async () => 10,
          },
          isMining: async () => true,
          isSyncing: async () => true,
          getHashrate: async () => 10,
          getCoinbase: () => "0x1234",
          getBalance: () => "1234",
        },
      };
    }
);

describe("Given a status plugin", () => {
  beforeEach(() => {
    // @ts-ignore
    RemoteAdminClient.mockClear();
  });

  test("Docker is not found and etd client is not on system and initialize Plugin", async () => {
    const statusPlugin = new StatusHandler();
    // @ts-ignore
    fs.existsSync.mockReturnValue(false);
    // @ts-ignore
    const mockRemoteAdminClient: RemoteAdminClient =
      // @ts-ignore
      RemoteAdminClient.mock.instances[0];

    await statusPlugin.startPlugin();
    expect(mockRemoteAdminClient.emit).toHaveBeenCalledTimes(1);
  });

  test("Docker is found and can be initialized", async () => {
    const statusHandler = new StatusHandler();
    // @ts-ignore
    fs.existsSync.mockReturnValue(true);
    // @ts-ignore
    const mockRemoteAdminClient = RemoteAdminClient.mock.instances[0];

    await statusHandler.startPlugin();
    expect(mockRemoteAdminClient.emit).toHaveBeenCalledTimes(1);
  });

  test("Send status with docker and web3's info", async () => {
    const statusHandler = new StatusHandler();
    // @ts-ignore
    fs.existsSync.mockReturnValue(true);
    // @ts-ignore
    const mockRemoteAdminClient = RemoteAdminClient.mock.instances[0];

    await statusHandler.startPlugin();
    await statusHandler.sendNodeInfo();

    expect(mockRemoteAdminClient.emit).toHaveBeenCalledTimes(2);
    expect(mockRemoteAdminClient.emit.mock.calls[1][1].data).toBeDefined();
    expect(mockRemoteAdminClient.emit.mock.calls[1][1].key).toBeUndefined();

    // Expect key returned from send info and use that key
    await statusHandler.sendNodeInfo();
    expect(mockRemoteAdminClient.emit.mock.calls[2][1].key).toBe("abcde");
  });
});
