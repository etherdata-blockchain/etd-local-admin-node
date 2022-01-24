import axios from "axios";
import { enums, interfaces } from "@etherdata-blockchain/common";
import { JobHandler } from "../../../internal/handlers/job/job_handler";
import { DockerJobService } from "../../../internal/services/job/docker_job_service";
import { Web3JobService } from "../../../internal/services/job/web3_job_service";
import { UpdateTemplateJobService } from "../../../internal/services/job/update_template_job_service";
import { RemoteAdminClient } from "../../../internal/remote_client";
import { MockBlockNumber, MockError, MockResult } from "../../mockdata";
import { Config } from "../../../config";
import { JobResult } from "../../../internal/services/general_service";
import clearAllMocks = jest.clearAllMocks;

jest.mock("../../../internal/services/job/update_template_job_service");
jest.mock("../../../internal/services/job/docker_job_service");
jest.mock("../../../internal/services/job/web3_job_service");
jest.mock("axios");

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
  };

describe("Given a job handler", () => {
  beforeAll(() => {
    process.env = {
      ...process.env,
      remoteAdminURL: "https://mock_server.com",
      remoteAdminPassword: "test",
    };
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("When given a web3 job", async () => {
    (Web3JobService as any).mockImplementationOnce(() => ({
      canHandle: jest.fn().mockResolvedValueOnce(true),
      handle: jest.fn().mockResolvedValueOnce({
        result: MockResult.rpcResult,
        error: undefined,
      }),
    }));

    (axios.get as any).mockResolvedValueOnce({
      data: {
        job: MockWeb3Job,
      },
    });
    const handler = new JobHandler();
    const result = await handler.requestJob();
    expect(result).toBeDefined();
    expect(result.result).toBe(MockResult.rpcResult);
    expect(result.success).toBeTruthy();
  });

  test("When given a web3 job with error", async () => {
    (Web3JobService as any).mockImplementationOnce(() => ({
      canHandle: jest.fn().mockResolvedValueOnce(true),
      handle: jest.fn().mockResolvedValueOnce({
        result: undefined,
        error: MockError.rpcConnectionError,
      }),
    }));

    (axios.get as any).mockResolvedValueOnce({
      data: {
        job: MockWeb3Job,
      },
    });
    const handler = new JobHandler();
    const result = await handler.requestJob();
    expect(result).toBeDefined();
    expect(result.result).toBe(MockError.rpcConnectionError);
    expect(result.success).toBeFalsy();
  });

  test("When given a docker job", async () => {
    (DockerJobService as any).mockImplementationOnce(() => ({
      canHandle: jest.fn().mockResolvedValueOnce(true),
      handle: jest.fn().mockResolvedValueOnce({
        result: MockResult.dockerResult,
        error: undefined,
      }),
    }));

    (axios.get as any).mockResolvedValueOnce({
      data: {
        job: MockDockerJob,
      },
    });
    const handler = new JobHandler();
    const result = await handler.requestJob();
    expect(result).toBeDefined();
    expect(result.result).toBe(MockResult.dockerResult);
    expect(result.success).toBeTruthy();
  });

  test("When given a docker job with error", async () => {
    (DockerJobService as any).mockImplementationOnce(() => ({
      canHandle: jest.fn().mockResolvedValueOnce(true),
      handle: jest.fn().mockResolvedValueOnce({
        result: undefined,
        error: MockError.dockerError,
      }),
    }));

    (axios.get as any).mockResolvedValueOnce({
      data: {
        job: MockDockerJob,
      },
    });
    const handler = new JobHandler();
    const result = await handler.requestJob();
    expect(result).toBeDefined();
    expect(result.result).toBe(MockError.dockerError);
    expect(result.success).toBeFalsy();
  });

  test("When given a update template job", async () => {
    (UpdateTemplateJobService as any).mockImplementationOnce(() => ({
      canHandle: jest.fn().mockResolvedValueOnce(true),
      handle: jest.fn().mockResolvedValueOnce({
        result: MockResult.updateResult,
        error: undefined,
      }),
    }));

    (axios.get as any).mockResolvedValueOnce({
      data: {
        job: MockUpdateTemplateJob,
      },
    });
    const handler = new JobHandler();
    const result = await handler.requestJob();
    expect(result).toBeDefined();
    expect(result.result).toBe(MockResult.updateResult);
    expect(result.success).toBeTruthy();
  });

  test("When given a update template job with error", async () => {
    (UpdateTemplateJobService as any).mockImplementationOnce(() => ({
      canHandle: jest.fn().mockResolvedValueOnce(true),
      handle: jest.fn().mockResolvedValueOnce({
        result: undefined,
        error: MockError.updateError,
      }),
    }));

    (axios.get as any).mockResolvedValueOnce({
      data: {
        job: MockUpdateTemplateJob,
      },
    });
    const handler = new JobHandler();
    const result = await handler.requestJob();
    expect(result).toBeDefined();
    expect(result.result).toBe(MockError.updateError);
    expect(result.success).toBeFalsy();
  });
});
