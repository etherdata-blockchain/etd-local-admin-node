import { NetworkStatusService } from "../../../src/internal/services/status/network_status_service";

jest.mock("../../../src/internal/remote_client");
jest.mock("@etherdata-blockchain/ip", () => ({
  getLocalIpAddress: jest.fn().mockReturnValue({
    eth0: ["192.168.0.1"],
  }),
}));

describe("Given a network status plugin", () => {
  const mockEmit = jest.fn().mockReturnValue({ key: "abcde" });

  test("When calling handle function", async () => {
    const statusPlugin = new NetworkStatusService();
    const result = await statusPlugin.handle();
    expect(result.localIpAddress).toBeDefined();
  });
});
