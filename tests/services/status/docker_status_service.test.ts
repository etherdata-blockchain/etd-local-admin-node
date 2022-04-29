import * as Docker from "dockerode";
import * as fs from "fs";
import { DockerStatusService } from "../../../src/internal/services/status/docker_status_service";

jest.mock("dockerode");
jest.mock("fs");

describe("Given a docker status service", () => {
  let mockContainerLog: jest.Mock;

  beforeEach(() => {
    mockContainerLog = jest.fn();
    (fs.existsSync as any).mockReturnValue(true);
  });

  afterEach(() => {
    (Docker as any).mockClear();
    mockContainerLog?.mockClear();
  });

  test("When calling function without any problem 1", async () => {
    mockContainerLog.mockReturnValue(Buffer.from("hello world"));

    const mockContainer = {
      logs: mockContainerLog,
      Id: "mock_id",
    };

    const mockContainer2 = {
      logs: mockContainerLog,
      Id: "mock_id_2",
    };

    (Docker as any).mockImplementation(() => ({
      getContainer: jest.fn().mockReturnValue(mockContainer),
      listImages: jest.fn().mockReturnValue([]),
      listContainers: jest
        .fn()
        .mockResolvedValue([mockContainer, mockContainer2]),
      listVolumes: jest
        .fn()
        .mockResolvedValue({ Volumes: [{ Name: "mock_volume_1" }] }),
    }));

    const service = new DockerStatusService();
    await service.start();
    const result = await service.handle();
    expect(result.containers).toHaveLength(2);
    expect(result.containers[0].logs).toBe("hello world");

    expect(result.containers[1].logs).toBe("hello world");
    expect(result.volumes[0].Name).toBe("mock_volume_1");
    expect(result.containers[0].Id).toBe("mock_id");
    expect(result.containers[1].Id).toBe("mock_id_2");
  });

  test("When calling function with problems", async () => {
    mockContainerLog
      .mockRejectedValueOnce(new Error(""))
      .mockResolvedValueOnce(Buffer.from("hello world"));

    const mockContainer = {
      logs: mockContainerLog,
      Id: "mock_id_2",
    };
    (Docker as any).mockImplementation(() => ({
      getContainer: jest.fn().mockReturnValue(mockContainer),
      listImages: jest.fn().mockReturnValue([]),
      listContainers: jest
        .fn()
        .mockResolvedValue([mockContainer, mockContainer]),
      listVolumes: jest
        .fn()
        .mockReturnValue({ Volumes: [{ Name: "mock_volume_1" }] }),
    }));

    const service = new DockerStatusService();
    await service.start();
    const result = await service.handle();
    console.log(result);
    expect(result.containers).toHaveLength(2);
    expect(
      result.containers.filter((c) => typeof c.logs === "string")
    ).toHaveLength(2);
    expect(result.volumes[0].Name).toBe("mock_volume_1");
  });

  test("When calling function with problems", async () => {
    mockContainerLog.mockResolvedValueOnce(Buffer.from("hello world"));

    const mockContainer = {
      logs: mockContainerLog,
      Id: "mock_id_2",
    };
    (Docker as any).mockImplementation(() => ({
      getContainer: jest.fn().mockReturnValue(mockContainer),
      listImages: jest.fn().mockReturnValue([]),
      listContainers: jest
        .fn()
        .mockResolvedValue([mockContainer, mockContainer]),
      listVolumes: jest.fn().mockRejectedValue(new Error()),
    }));

    const service = new DockerStatusService();
    await service.start();
    const result = await service.handle();
    expect(result.containers).toHaveLength(2);
    expect(
      result.containers.filter((c) => typeof c.logs === "string")
    ).toHaveLength(2);
    expect(result.volumes).toHaveLength(0);
  });
});
