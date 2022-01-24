import { enums } from "@etherdata-blockchain/common";
import { Buffer } from "buffer";
import * as fs from "fs";
import { MockDockerLogs } from "../../mockdata";
import { DockerJobService } from "../../../internal/services/job/docker_job_service";

const container = {
  id: "1",
  logs: jest.fn().mockResolvedValueOnce(Buffer.from(MockDockerLogs.simpleLog)),
};

jest.mock("dockerode", () =>
  jest.fn().mockImplementation(() => ({
    getContainer: jest.fn().mockReturnValue(container),
  }))
);

jest.mock("fs");

const MockDataDockerCalling: enums.DockerValueType = {
  method: "logs",
  value: "1",
};

const MockDataDockerCallingUnsupported: enums.DockerValueType = {
  method: "any" as any,
  value: "1",
};

describe("Given a docker job service and docker exists", () => {
  beforeEach(() => {
    (fs.existsSync as any).mockReturnValue(true);
  });

  test("When calling without any error", async () => {
    const service = new DockerJobService();
    await service.start();

    const result = await service.handle(MockDataDockerCalling);
    expect(result.result).toBe(MockDockerLogs.simpleLog);
    expect(result.error).toBeUndefined();
  });

  test("When calling with error", async () => {
    const service = new DockerJobService();
    await service.start();

    const result = await service.handle(MockDataDockerCallingUnsupported);
    expect(result.result).toBeUndefined();
    expect(result.error).toBeDefined();
  });
});

describe("Given a docker job service and docker not exist", () => {
  beforeEach(() => {
    (fs.existsSync as any).mockReturnValue(false);
  });

  test("When calling with error and supported", async () => {
    const service = new DockerJobService();
    await service.start();

    const result = await service.handle(MockDataDockerCalling);
    expect(result.result).toBeUndefined();
    expect(result.error).toBeDefined();
  });

  test("When calling with error", async () => {
    const service = new DockerJobService();
    await service.start();

    const result = await service.handle(MockDataDockerCallingUnsupported);
    expect(result.result).toBeUndefined();
    expect(result.error).toBeDefined();
  });
});
