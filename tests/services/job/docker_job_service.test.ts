import { enums } from "@etherdata-blockchain/common";
import { Buffer } from "buffer";
import * as fs from "fs";
import Dockerode from "dockerode";
import { MockDockerLogs } from "../../mockdata";
import { DockerJobService } from "../../../src/internal/services/job/docker_job_service";
import { JobHandler } from "../../../src/internal/handlers/job/job_handler";
import {
  RegisteredHandler,
  RegisteredService,
} from "../../../src/internal/enums/names";

const container = {
  id: "1",
  logs: jest.fn().mockResolvedValue(Buffer.from(MockDockerLogs.simpleLog)),
  stop: jest.fn(),
  remove: jest.fn(),
};

jest.mock("dockerode", () =>
  jest.fn().mockImplementation(() => ({
    getContainer: jest.fn().mockReturnValue(container),
    getImage: jest.fn().mockReturnValue({ remove: jest.fn() }),
    getVolume: jest.fn().mockReturnValue({ remove: jest.fn() }),
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

  test("When given a docker job and docker service", async () => {
    const mockStatus = jest.fn();

    const handler = new JobHandler();
    const StatusHandler: any = jest.fn().mockImplementation(() => ({
      handleJob: mockStatus,
      handlerName: RegisteredHandler.statusHandler,
    }));
    handler.addHandlers([new StatusHandler()]);

    await handler.startHandler();
    const jobService: DockerJobService = handler.findServiceByName(
      RegisteredService.dockerJobService
    );
    const result = await jobService.handle({
      method: "logs",
      value: "mock_id",
    });
    expect(result).toBeDefined();
    expect(result.result).toBe(MockDockerLogs.simpleLog);
    expect(mockStatus).toBeCalledTimes(1);
  });

  test("When calling without any error 1", async () => {
    const service = new DockerJobService();
    await service.start();

    const result = await service.handle(MockDataDockerCalling);
    expect(result.result).toBe(MockDockerLogs.simpleLog);
    expect(result.error).toBeUndefined();
  });

  test("When calling without any error 2", async () => {
    const service = new DockerJobService();
    await service.start();

    const result = await service.handle({
      method: "removeVolume",
      value: "mock_id",
    });
    expect(result.result).toBe("undefined");
    expect(result.error).toBeUndefined();
  });

  test("When calling without any error 3", async () => {
    const service = new DockerJobService();
    await service.start();

    const result = await service.handle({
      method: "removeImage",
      value: "mock_id",
    });
    expect(result.result).toBe("undefined");
    expect(result.error).toBeUndefined();
  });

  test("When calling without any error 4", async () => {
    const service = new DockerJobService();
    await service.start();

    const result = await service.handle({
      method: "removeContainer",
      value: "mock_id",
    });
    expect(result.result).toBe("undefined");
    expect(result.error).toBeUndefined();
  });

  test("When calling without any error 5", async () => {
    const service = new DockerJobService();
    await service.start();

    const result = await service.handle({
      method: "stopContainer",
      value: "mock_id",
    });
    expect(result.result).toBe("undefined");
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
