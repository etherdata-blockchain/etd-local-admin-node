import { StatusPlugin } from "../../plugin/plugins/statusPlugin";
import { RemoteAdminClient } from "../../node_client/admin-client";
import * as fs from "fs";

jest.mock("../../node_client/admin-client");
jest.mock("fs");
jest.mock("dockerode");
jest.mock("web3-eth-admin");
jest.mock("web3");

test("Docker is not found and etd client is not on system and initialize Plugin", async () => {
  //@ts-ignore
  fs.existsSync.mockReturnValue(false);

  const statusPlugin = new StatusPlugin();
  await statusPlugin.startPlugin();
  expect(RemoteAdminClient).toHaveBeenCalledTimes(1);
});

test("Docker is found and can be initialized", async () => {
  //@ts-ignore
  fs.existsSync.mockReturnValue(true);

  const statusPlugin = new StatusPlugin();
  await statusPlugin.startPlugin();
  expect(RemoteAdminClient).toHaveBeenCalledTimes(1);
});

test("Send status with docker and web3's info", () => {});
