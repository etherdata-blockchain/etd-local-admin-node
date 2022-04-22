import * as fs from "fs";
import Web3 from "web3";
import { StatusHandler } from "../../../src/internal/handlers/status/status_handler";
import { RemoteAdminClient } from "../../../src/internal/remote_client";
import { DefaultSettings } from "../../../src/config";
import { NodeInfoService } from "../../../src/internal/services/status/node_info_service";
import { RegisteredService } from "../../../src/internal/enums/names";

jest.mock("../../../src/internal/remote_client");
jest.mock("fs");
jest.mock("dockerode");
jest.mock("web3-eth-admin");
jest.mock("web3");
jest.mock("@etherdata-blockchain/ip", () => ({
  getLocalIpAddress: jest.fn().mockReturnValue({
    eth0: ["192.168.0.1"],
  }),
}));

describe("Given a status plugin", () => {
  const mockEmit = jest.fn().mockReturnValue({ key: "abcde" });

  beforeEach(() => {
    DefaultSettings.jobInterval = 0;
    mockEmit.mockClear();
    (RemoteAdminClient as any).mockImplementation(() => ({
      emit: mockEmit,
    }));

    (Web3 as any).mockImplementation(() => ({
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
    }));
  });

  test("Docker is not found and etd client is not on system and initialize Plugin", async () => {
    const statusPlugin = new StatusHandler();

    (fs.existsSync as any).mockReturnValue(false);

    await statusPlugin.startHandler();
    expect(mockEmit).toHaveBeenCalledTimes(1);
  });

  test("Docker is found and can be initialized", async () => {
    const statusHandler = new StatusHandler();

    (fs.existsSync as any).mockReturnValue(true);

    await statusHandler.startHandler();
    expect(mockEmit).toHaveBeenCalledTimes(1);
  });

  test("When sending info using prev key", async () => {
    const statusHandler = new StatusHandler();

    (fs.existsSync as any).mockReturnValue(true);

    await statusHandler.startHandler();
    const service: NodeInfoService = statusHandler.findServiceByName(
      RegisteredService.nodeInfoService
    );
    await service.handle();

    expect(mockEmit).toHaveBeenCalledTimes(2);
    expect(mockEmit.mock.calls[1][1].data).toBeDefined();
    expect(mockEmit.mock.calls[1][1].key).toBeUndefined();

    await service.handle();
    // Expect key returned from send info and use that key
    expect(mockEmit.mock.calls[2][1].key).toBe("abcde");
    expect(mockEmit.mock.calls[2][1].networkSettings.localIpAddress).toBe(
      "192.168.0.1"
    );
  });
});
