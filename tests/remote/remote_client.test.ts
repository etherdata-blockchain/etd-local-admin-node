import { RemoteAdminClient } from "../../src/internal/remote_client";
import { Config } from "../../src/config";
import { MockAdminURL } from "../mockdata";
import { Channel } from "../../src/internal/enums/channels";

jest.mock("../../src/config");

describe("Given a remote client", () => {
  const mockData = { hello: "world" };

  beforeEach(() => {});

  beforeAll(() => {
    const mockAxios = {
      get: jest.fn().mockResolvedValue({ data: mockData }),

      post: jest.fn().mockResolvedValue({ data: mockData }),
    };

    const mockConfig = {
      getAxios: jest.fn().mockReturnValue(mockAxios),
      remoteAdminURL: MockAdminURL,
    };

    (Config.fromEnvironment as any).mockReturnValue(mockConfig);
  });

  test("When sending a node info", async () => {
    const remoteClient = new RemoteAdminClient();
    const result = await remoteClient.emit(Channel.nodeInfo, {}, "somedata");

    expect(result.hello).toBe("world");
  });

  test("When requesting a job", async () => {
    const remoteClient = new RemoteAdminClient();
    const result = await remoteClient.emit(Channel.requestJob, {}, "somedata");
    expect(result.hello).toBe("world");
  });

  test("When submitting results", async () => {
    const remoteClient = new RemoteAdminClient();
    const result = await remoteClient.emit(
      Channel.submitResult,
      {},
      "somedata"
    );
    expect(result.hello).toBe("world");
  });

  test("When calling health", async () => {
    const remoteClient = new RemoteAdminClient();
    const result = await remoteClient.emit(Channel.health, {}, "somedata");
    expect(result.hello).toBe("world");
  });
});
