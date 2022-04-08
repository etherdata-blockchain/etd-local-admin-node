import Web3 from "web3";
import { Web3StatusService } from "../../../src/internal/services/status/web3_status_service";

jest.mock("web3");
jest.mock("web3-eth-admin");

describe("Given a web3 status service", () => {
  let service: Web3StatusService;

  test("When calling prepareWeb3Info", async () => {
    (Web3 as any).mockImplementation(() => ({
      eth: {
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

    service = new Web3StatusService();
    await service.connect();

    const data = await service.prepareWebThreeInfo(10);
    expect(data).toBeDefined();
    expect(data.number).toBe(10);
    expect(data.avgBlockTime).toBe(0);
    expect(data.systemInfo.isMining).toBe(true);
    expect(data.systemInfo.peerCount).toBe(4);
    expect(data.systemInfo.isSyncing).toBeTruthy();
    expect(data.systemInfo.hashRate).toBe(400);
  });

  test("When some apis are not available", async () => {
    (Web3 as any).mockImplementation(() => ({
      eth: {
        getBlock: jest.fn().mockRejectedValue({}),
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

    service = new Web3StatusService();
    await service.connect();

    const data = await service.prepareWebThreeInfo(10);
    expect(data).toBeDefined();
    expect(data.number).toBe(undefined);
    expect(data.avgBlockTime).toBe(undefined);
    expect(data.systemInfo.isMining).toBe(true);
    expect(data.systemInfo.peerCount).toBe(4);
    expect(data.systemInfo.isSyncing).toBeTruthy();
    expect(data.systemInfo.hashRate).toBe(400);
  });

  test("When all apis are not available", async () => {
    (Web3 as any).mockImplementation(() => ({
      eth: {
        getBlock: jest.fn().mockRejectedValue(undefined),
        getNodeInfo: jest.fn().mockRejectedValue(undefined),
        getPeerCount: jest.fn().mockRejectedValue(undefined),
        isMining: jest.fn().mockRejectedValue(undefined),
        isSyncing: jest.fn().mockRejectedValue(undefined),
        getHashrate: jest.fn().mockRejectedValue(undefined),
        getCoinbase: jest.fn().mockRejectedValue(undefined),
        net: {
          getPeerCount: jest.fn().mockRejectedValue(undefined),
        },
      },
    }));

    service = new Web3StatusService();
    await service.connect();

    const data = await service.prepareWebThreeInfo(10);
    expect(data).toBeDefined();
    expect(data.number).toBe(undefined);
    expect(data.avgBlockTime).toBe(undefined);
    expect(data.systemInfo.isMining).toBe(false);
    expect(data.systemInfo.peerCount).toBe(0);
    expect(data.systemInfo.isSyncing).toBeFalsy();
    expect(data.systemInfo.hashRate).toBe(0);
  });

  test("When calling get latest block number", async () => {
    (Web3 as any).mockImplementation(() => ({
      eth: {
        getBlockNumber: jest.fn().mockReturnValue(1000),
      },
    }));

    service = new Web3StatusService();
    await service.connect();

    expect(await service.getLatestBlockNumber()).toBe(1000);
  });

  test("When calling get latest block number", async () => {
    (Web3 as any).mockImplementation(() => ({
      eth: {
        getBlockNumber: jest.fn().mockRejectedValue(undefined),
      },
    }));

    service = new Web3StatusService();
    await service.connect();

    expect(await service.getLatestBlockNumber()).toBe(undefined);
  });
});
