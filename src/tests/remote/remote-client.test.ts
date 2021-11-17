import { RemoteAdminClient } from "../../node_client/admin-client";
import axios from "axios";

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
  await remoteClient.emit("node-info", {}, "somedata");
  expect(axios.post).toBeCalled();
});

test("Request a job", async () => {
  const remoteClient = new RemoteAdminClient();
  await remoteClient.emit("request-job", {}, "somedata");
  expect(axios.get).toBeCalled();
});

test("Submit results", async () => {
  const remoteClient = new RemoteAdminClient();
  await remoteClient.emit("submit-result", {}, "somedata");
  expect(axios.post).toBeCalled();
});

test("health", async () => {
  const remoteClient = new RemoteAdminClient();
  await remoteClient.emit("health", {}, "somedata");
  expect(axios.get).toBeCalled();
});
