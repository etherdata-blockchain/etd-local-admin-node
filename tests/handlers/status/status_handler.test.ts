import Web3 from "web3";
import { StatusHandler } from "../../../src/internal/handlers/status/status_handler";
import { RemoteAdminClient } from "../../../src/internal/remote_client";
import { Channel } from "../../../src/internal/enums/channels";
import { DefaultSettings } from "../../../src/config";
import { RegisteredService } from "../../../src/internal/enums/names";
import { NodeInfoService } from "../../../src/internal/services/status/node_info_service";

jest.mock("web3");
jest.mock("web3-eth-admin");
jest.mock("../../../src/internal/remote_client");

describe("Given a status handler", () => {
  beforeEach(() => {
    DefaultSettings.jobInterval = 0;
  });

  test("When calling send node info", async () => {
    (Web3 as any).mockImplementation(() => ({
      eth: {
        blockNumber: jest.fn().mockRejectedValue(undefined),
        getBlock: jest.fn().mockReturnValue({ number: 10, timestamp: 10 }),
        getNodeInfo: jest.fn(),
        getPeerCount: jest.fn(),
        isMining: jest.fn().mockReturnValue(true),
        isSyncing: jest.fn().mockReturnValue(true),
        getHashrate: jest.fn().mockReturnValue(400),
        getCoinbase: jest.fn().mockReturnValue("0x"),
        net: {
          getPeerCount: jest.fn().mockReturnValue(4),
        },
      },
    }));
    const mockEmit = jest.fn();

    (RemoteAdminClient as any).mockImplementation(() => ({ emit: mockEmit }));

    const handler = new StatusHandler();
    await handler.startHandler();
    const service: NodeInfoService = handler.findServiceByName(
      RegisteredService.nodeInfoService
    );
    await service.handle();

    expect(mockEmit).toBeCalledTimes(2);
    expect(mockEmit.mock.calls[0][0]).toBe(Channel.nodeInfo);
    expect(mockEmit.mock.calls[1][0]).toBe(Channel.nodeInfo);
    expect(mockEmit.mock.calls[1][1].data).toBeDefined();
    expect(mockEmit.mock.calls[1][1].docker.images).toBeDefined();
    expect(mockEmit.mock.calls[1][1].docker.containers).toBeDefined();
  });
});
