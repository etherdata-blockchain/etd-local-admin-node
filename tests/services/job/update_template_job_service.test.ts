// @ts-ignore
import nock from "nock";
import { StatusCodes } from "http-status-codes";
import { interfaces } from "@etherdata-blockchain/common";
import axios from "axios";
import { DockerPlan } from "@etherdata-blockchain/docker-plan";
import { MockAdminURL } from "../../mockdata";
import { UpdateTemplateJobService } from "../../../src/internal/services/job/update_template_job_service";
import { Urls } from "../../../src/internal/enums/urls";
import { Config } from "../../../src/config";

jest.mock("../../../src/config");
jest.mock("@etherdata-blockchain/docker-plan");

const MockImageStack = {
  image: "hello-world",
  tag: "latest",
  imageName: "hello-world",
  tags: {
    tag: "latest",
  },
};

const MockContainStack: interfaces.db.ContainerStack = {
  containerName: "hello-world",
  image: MockImageStack,
  config: {
    Env: ["coinbase=${etd_coinbase}", "name=mock_name"],
    HostConfig: {
      Binds: ["a:b"],
    },
  },
};

const MockUpdateTemplate: interfaces.db.UpdateTemplateWithDockerImageDBInterface =
  {
    _id: "1",
    name: "mock_name",
    targetDeviceIds: ["1"],
    targetGroupIds: ["1"],
    from: "admin",
    imageStacks: [MockImageStack],
    containerStacks: [MockContainStack as any],
    description: "",
  };

describe("Given a update template job service", () => {
  beforeAll(() => {
    const mockConfig = {
      getAxios: () => axios.create(),
      remoteAdminURL: MockAdminURL,
    };

    (Config.fromEnvironment as any).mockReturnValue(mockConfig);
  });

  test("When calling handler on update template service without any error", async () => {
    nock(MockAdminURL)
      .get(`${Urls.update}/1`)
      .reply(StatusCodes.OK, MockUpdateTemplate);

    const mockCreate = jest.fn();

    (DockerPlan as any).mockImplementation(() => ({
      apply: jest.fn().mockReturnValue({
        success: true,
        error: undefined,
      }),
      create: mockCreate,
    }));

    const service = new UpdateTemplateJobService();
    const result = await service.handle({ templateId: "1", coinbase: "123" });
    expect(result.error).toBeUndefined();
    expect(result.result).toBe("Output 1\n\n");
    expect(
      mockCreate.mock.calls[0][0].containers[0].config.HostConfig.Binds[0]
    ).toBe("a:b");
    expect(mockCreate.mock.calls[0][0].containers[0].config.Env[1]).toBe(
      "name=mock_name"
    );
  });

  test("When calling handler on update template service with ise", async () => {
    nock(MockAdminURL)
      .get(`${Urls.update}/1`)
      .reply(StatusCodes.INTERNAL_SERVER_ERROR);

    const service = new UpdateTemplateJobService();
    const result = await service.handle({ templateId: "1" });
    expect(result.error).toBeDefined();
    expect(result.result).toBeUndefined();
  });
});
