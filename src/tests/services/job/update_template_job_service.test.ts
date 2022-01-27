// @ts-ignore
import nock from "nock";
import { StatusCodes } from "http-status-codes";
import { interfaces } from "@etherdata-blockchain/common";
import axios from "axios";
import { MockAdminURL } from "../../mockdata";
import { Urls } from "../../../internal/enums/urls";
import { UpdateTemplateJobService } from "../../../internal/services/job/update_template_job_service";
import { Config } from "../../../config";

jest.mock("../../../config");
jest.mock("@etherdata-blockchain/docker-plan");

const MockImageStack = {
  imageName: "hello-world",
  tags: {
    tag: "latest",
  },
};

const MockContainStack = {
  containerName: "hello-world",
  image: MockImageStack,
};

const MockUpdateTemplate: interfaces.db.UpdateTemplateWithDockerImageDBInterface =
  {
    _id: "1",
    name: "mock_name",
    targetDeviceIds: ["1"],
    targetGroupIds: ["1"],
    from: "admin",
    imageStacks: [MockImageStack],
    containerStacks: [MockContainStack],
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

    const service = new UpdateTemplateJobService();
    const result = await service.handle("1");
    expect(result.error).toBeUndefined();
    expect(result.result).toBe("success");
  });

  test("When calling handler on update template service with ise", async () => {
    nock(MockAdminURL)
      .get(`${Urls.update}/1`)
      .reply(StatusCodes.INTERNAL_SERVER_ERROR);

    const service = new UpdateTemplateJobService();
    const result = await service.handle("1");
    expect(result.error).toBeDefined();
    expect(result.result).toBeUndefined();
  });
});
