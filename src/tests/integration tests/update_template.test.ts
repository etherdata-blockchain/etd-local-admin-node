import { enums, interfaces, utils } from "@etherdata-blockchain/common";
// @ts-ignore
import nock from "nock";
import axios from "axios";
import { StatusCodes } from "http-status-codes";
// @ts-ignore
import Docker from "dockerode";
import * as fs from "fs";
import { MockAdminURL } from "../mockdata";
import { Urls } from "../../internal/enums/urls";
import { Config } from "../../config";
import { UpdateTemplateJobService } from "../../internal/services/job/update_template_job_service";
import { NodeClient } from "../../node_client/node_client";
import { JobHandler } from "../../internal/handlers/job/job_handler";

jest.mock("../../config");

const containerName = "hello-world-test";

const MockUpdateTemplateJob: interfaces.db.PendingJobDBInterface<enums.UpdateTemplateValueType> =
  {
    targetDeviceId: "",
    from: "",
    task: {
      type: enums.JobTaskType.UpdateTemplate,
      value: {
        templateId: "1",
      },
    },
    createdAt: "",
    retrieved: false,
  };

const MockImageStack = {
  imageName: "hello-world",
  tags: {
    tag: "latest",
  },
};

const MockContainStack = {
  containerName,
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

async function deleteMockContainer(name: string) {
  const docker = new Docker();
  const containers = await docker.listContainers({ all: true });
  const found = containers.find((c) => c.Names.includes(`/${name}`));
  if (found) {
    const container = docker.getContainer(found.Id);
    try {
      await container.stop();
    } catch (err) {
      console.log("Container is not running");
    }
    await container.remove();
  }
}

describe("Given a update template", () => {
  const docker = new Docker();

  beforeAll(async () => {
    const mockConfig = {
      getAxios: () => axios.create(),
      remoteAdminURL: MockAdminURL,
    };

    (Config.fromEnvironment as any).mockReturnValue(mockConfig);
    await deleteMockContainer(containerName);
  });

  afterEach(async () => {
    await deleteMockContainer(containerName);
  });

  test(
    "When trying to set up docker without any existing container",
    async () => {
      if (fs.existsSync("stack.lock.yaml")) {
        fs.unlinkSync("stack.lock.yaml");
      }
      nock(MockAdminURL)
        .get(`${Urls.update}/1`)
        .reply(StatusCodes.OK, MockUpdateTemplate);

      nock(MockAdminURL)
        .get(Urls.job)
        .reply(StatusCodes.OK, { job: MockUpdateTemplateJob });

      const client = new NodeClient({ handlers: [new JobHandler()] });

      await client.startApp();

      await utils.sleep(10 * 1000);

      const containers = await docker.listContainers({ all: true });
      const found = containers.find((c) =>
        c.Names.includes(`/${containerName}`)
      );
      expect(found).toBeDefined();
    },
    60 * 1000
  );
});
