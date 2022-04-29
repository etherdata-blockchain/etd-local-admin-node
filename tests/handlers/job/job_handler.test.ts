import { enums, interfaces } from "@etherdata-blockchain/common";
// @ts-ignore
import nock from "nock";
import { StatusCodes } from "http-status-codes";
import { JobHandler } from "../../../src/internal/handlers/job/job_handler";
import { DockerJobService } from "../../../src/internal/services/job/docker_job_service";
import { Web3JobService } from "../../../src/internal/services/job/web3_job_service";
import { UpdateTemplateJobService } from "../../../src/internal/services/job/update_template_job_service";
import { MockAdminURL, MockError, MockResult } from "../../mockdata";
import { Urls } from "../../../src/internal/enums/urls";
import { RegisteredService } from "../../../src/internal/enums/names";
import { RequestJobService } from "../../../src/internal/services/job/request_job_service";
import { DefaultSettings } from "../../../src/config";
import { StatusHandler } from "../../../src/internal/handlers/status/status_handler";

jest.mock("../../../src/internal/services/job/update_template_job_service");
jest.mock("../../../src/internal/services/job/docker_job_service");
jest.mock("../../../src/internal/services/job/web3_job_service");

const MockWeb3Job: interfaces.db.PendingJobDBInterface<enums.Web3ValueType> = {
  targetDeviceId: "",
  from: "",
  task: {
    type: enums.JobTaskType.Web3,
    value: {
      method: "mock",
      params: [],
    },
  },
  createdAt: "",
  retrieved: false,
  tries: 0,
};

const MockDockerJob: interfaces.db.PendingJobDBInterface<enums.DockerValueType> =
  {
    targetDeviceId: "",
    from: "",
    task: {
      type: enums.JobTaskType.Docker,
      value: {
        method: "logs",
        value: "",
      },
    },
    createdAt: "",
    retrieved: false,
    tries: 0,
  };

const MockUpdateTemplateJob: interfaces.db.PendingJobDBInterface<enums.UpdateTemplateValueType> =
  {
    targetDeviceId: "",
    from: "",
    task: {
      type: enums.JobTaskType.UpdateTemplate,
      value: {
        templateId: "mock_id",
      },
    },
    createdAt: "",
    retrieved: false,
    tries: 0,
  };

describe("Given a job handler", () => {
  beforeAll(() => {
    process.env = {
      ...process.env,
      remoteAdminURL: MockAdminURL,
      remoteAdminPassword: "test",
    };

    DefaultSettings.jobInterval = 0;
  });

  beforeEach(() => {
    nock(MockAdminURL).get(Urls.health).reply(StatusCodes.OK);
    nock(MockAdminURL).post(Urls.result).reply(StatusCodes.OK);
    (DockerJobService as any).mockImplementation(() => ({
      name: RegisteredService.dockerJobService,
      start: jest.fn(),
    }));

    (UpdateTemplateJobService as any).mockImplementation(() => ({
      name: RegisteredService.updateTemplateJobService,
      start: jest.fn(),
    }));

    (Web3JobService as any).mockImplementation(() => ({
      name: RegisteredService.web3JobService,
      start: jest.fn(),
    }));

    jest.clearAllMocks();
  });

  test("When given a web3 job", async () => {
    (Web3JobService as any).mockImplementationOnce(() => ({
      name: RegisteredService.web3JobService,
      start: jest.fn(),
      canHandle: jest.fn().mockResolvedValueOnce(true),
      handle: jest.fn().mockResolvedValueOnce({
        result: MockResult.rpcResult,
        error: undefined,
      }),
    }));

    nock(MockAdminURL)
      .get(Urls.job)
      .reply(StatusCodes.OK, { job: MockWeb3Job });
    const handler = new JobHandler();
    await handler.startHandler();
    const jobService: RequestJobService = handler.findServiceByName(
      RegisteredService.requestJobService
    );
    const result =
      (await jobService.handle()) as any as interfaces.db.JobResultDBInterface;

    expect(result).toBeDefined();
    expect(result.result).toBe(MockResult.rpcResult);
    expect(result.success).toBeTruthy();
  });

  test("When given a web3 job with error", async () => {
    (Web3JobService as any).mockImplementationOnce(() => ({
      name: RegisteredService.web3JobService,
      start: jest.fn(),
      canHandle: jest.fn().mockResolvedValueOnce(true),
      handle: jest.fn().mockResolvedValueOnce({
        result: undefined,
        error: MockError.rpcConnectionError,
      }),
    }));

    nock(MockAdminURL)
      .get(Urls.job)
      .reply(StatusCodes.OK, { job: MockWeb3Job });

    const handler = new JobHandler();
    await handler.startHandler();
    const jobService: RequestJobService = handler.findServiceByName(
      RegisteredService.requestJobService
    );
    const result =
      (await jobService.handle()) as any as interfaces.db.JobResultDBInterface;
    expect(result).toBeDefined();
    expect(result.result).toBe(MockError.rpcConnectionError);
    expect(result.success).toBeFalsy();
  });

  test("When given a docker job", async () => {
    (DockerJobService as any).mockImplementationOnce(() => ({
      name: RegisteredService.dockerJobService,
      start: jest.fn(),
      canHandle: jest.fn().mockResolvedValueOnce(true),
      handle: jest.fn().mockResolvedValueOnce({
        result: MockResult.dockerResult,
        error: undefined,
      }),
    }));

    nock(MockAdminURL)
      .get(Urls.job)
      .reply(StatusCodes.OK, { job: MockDockerJob });

    const handler = new JobHandler();

    await handler.startHandler();
    const jobService: RequestJobService = handler.findServiceByName(
      RegisteredService.requestJobService
    );
    const result =
      (await jobService.handle()) as any as interfaces.db.JobResultDBInterface;
    expect(result).toBeDefined();
    expect(result.result).toBe(MockResult.dockerResult);
    expect(result.success).toBeTruthy();
  });

  test("When given a docker job with error", async () => {
    (DockerJobService as any).mockImplementationOnce(() => ({
      name: RegisteredService.dockerJobService,
      start: jest.fn(),
      canHandle: jest.fn().mockResolvedValueOnce(true),
      handle: jest.fn().mockResolvedValueOnce({
        result: undefined,
        error: MockError.dockerError,
      }),
    }));

    nock(MockAdminURL)
      .get(Urls.job)
      .reply(StatusCodes.OK, { job: MockDockerJob });

    const handler = new JobHandler();
    await handler.startHandler();
    const jobService: RequestJobService = handler.findServiceByName(
      RegisteredService.requestJobService
    );
    const result =
      (await jobService.handle()) as any as interfaces.db.JobResultDBInterface;
    expect(result).toBeDefined();
    expect(result.result).toBe(MockError.dockerError);
    expect(result.success).toBeFalsy();
  });

  test("When given a update template job", async () => {
    (UpdateTemplateJobService as any).mockImplementationOnce(() => ({
      name: RegisteredService.updateTemplateJobService,
      start: jest.fn(),
      canHandle: jest.fn().mockResolvedValueOnce(true),
      handle: jest.fn().mockResolvedValueOnce({
        result: MockResult.updateResult,
        error: undefined,
      }),
    }));

    nock(MockAdminURL)
      .get(Urls.job)
      .reply(StatusCodes.OK, { job: MockUpdateTemplateJob });
    const handler = new JobHandler();
    await handler.startHandler();
    const jobService: RequestJobService = handler.findServiceByName(
      RegisteredService.requestJobService
    );
    const result =
      (await jobService.handle()) as any as interfaces.db.JobResultDBInterface;
    expect(result).toBeDefined();
    expect(result.result).toBe(MockResult.updateResult);
    expect(result.success).toBeTruthy();
  });

  test("When given a update template job with error", async () => {
    (UpdateTemplateJobService as any).mockImplementationOnce(() => ({
      name: RegisteredService.updateTemplateJobService,
      start: jest.fn(),
      canHandle: jest.fn().mockResolvedValueOnce(true),
      handle: jest.fn().mockResolvedValueOnce({
        result: undefined,
        error: MockError.updateError,
      }),
    }));

    nock(MockAdminURL)
      .get(Urls.job)
      .reply(StatusCodes.OK, { job: MockUpdateTemplateJob });
    const handler = new JobHandler();
    await handler.startHandler();
    const jobService: RequestJobService = handler.findServiceByName(
      RegisteredService.requestJobService
    );
    const result =
      (await jobService.handle()) as any as interfaces.db.JobResultDBInterface;
    expect(result).toBeDefined();
    expect(result.result).toBe(MockError.updateError);
    expect(result.success).toBeFalsy();
  });
});
