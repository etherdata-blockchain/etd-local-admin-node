import { enums, interfaces, utils } from "@etherdata-blockchain/common";
// @ts-ignore
import nock from "nock";
import { StatusCodes } from "http-status-codes";
// @ts-ignore
import Docker from "dockerode";
import * as fs from "fs";
import { assert, expect, should } from "chai";
import { MockAdminURL } from "../mockdata";
import { Urls } from "../../internal/enums/urls";
import { NodeClient } from "../../node_client/node_client";
import { JobHandler } from "../../internal/handlers/job/job_handler";

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

export default async function run() {
  const docker = new Docker();
  process.env = {
    ...process.env,
    remoteAdminURL: MockAdminURL,
    remoteAdminPassword: "password",
  };

  if (fs.existsSync("stack.lock.yaml")) {
    fs.unlinkSync("stack.lock.yaml");
  }
  nock(MockAdminURL)
    .get(`${Urls.update}/1`)
    .reply(StatusCodes.OK, MockUpdateTemplate);

  nock(MockAdminURL)
    .get(Urls.job)
    .reply(StatusCodes.OK, { job: MockUpdateTemplateJob });

  nock(MockAdminURL).get(Urls.result).reply(StatusCodes.OK);

  nock(MockAdminURL).get(Urls.health).reply(StatusCodes.OK);

  const client = new NodeClient({ handlers: [new JobHandler()] });

  await client.startApp();

  await utils.sleep(60 * 1000);

  const containers = await docker.listContainers({ all: true });
  const found = containers.find((c) => c.Names.includes(`/${containerName}`));
  assert.isDefined(found);
  await deleteMockContainer(containerName);
  process.exit();
}
