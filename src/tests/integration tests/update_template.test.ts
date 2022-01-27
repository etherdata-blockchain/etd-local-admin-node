import { interfaces } from "@etherdata-blockchain/common";
// @ts-ignore
import nock from "nock";
import axios from "axios";
import { StatusCodes } from "http-status-codes";
import { MockAdminURL } from "../mockdata";
import { Urls } from "../../internal/enums/urls";
import { Config } from "../../config";
import { UpdateTemplateJobService } from "../../internal/services/job/update_template_job_service";

jest.mock("../../config");

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

describe("Given a update template", () => {
  beforeAll(() => {
    const mockConfig = {
      getAxios: () => axios.create(),
      remoteAdminURL: MockAdminURL,
    };

    (Config.fromEnvironment as any).mockReturnValue(mockConfig);
  });

  test(
    "When trying to set up docker",
    async () => {
      nock(MockAdminURL)
        .get(`${Urls.update}/1`)
        .reply(StatusCodes.OK, MockUpdateTemplate);
      const service = new UpdateTemplateJobService();
      const result = await service.handle("1");
      expect(result.error).toBeUndefined();
      expect(result.result).toBe("success");
    },
    60 * 1000
  );
});
