import axios from "axios";
import {
  Channel,
  RemoteAdminClient,
} from "../../internal/handlers/job/admin-client";

jest.mock("axios");

beforeEach(() => {
  process.env = {
    ...process.env,
    remoteAdminURL: "https://local.admin.net",
    remoteAdminPassword: "somepassword",
  };
});

test("Send a node info", async () => {
  const remoteClient = new RemoteAdminClient();
  await remoteClient.emit(Channel.nodeInfo, {}, "somedata");
  expect(axios.post).toBeCalled();
});

test("Request a job", async () => {
  const remoteClient = new RemoteAdminClient();
  await remoteClient.emit(Channel.requestJob, {}, "somedata");
  expect(axios.get).toBeCalled();
});

test("Submit results", async () => {
  const remoteClient = new RemoteAdminClient();
  await remoteClient.emit(Channel.submitResult, {}, "somedata");
  expect(axios.post).toBeCalled();
});

test("health", async () => {
  const remoteClient = new RemoteAdminClient();
  await remoteClient.emit(Channel.health, {}, "somedata");
  expect(axios.get).toBeCalled();
});
