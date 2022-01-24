import axios from "axios";
import jwt from "jsonwebtoken";
import Logger from "@etherdata-blockchain/logger";
import HTTPMethod from "http-method-enum";
import { Config } from "../config";
import { Channel } from "./utils/command/enums";

export class RemoteAdminClient {
  config = Config.fromEnvironment();

  // eslint-disable-next-line consistent-return
  async emit(
    channel: Channel,
    data: any,
    authData: string,
    throwError?: boolean
  ) {
    Logger.info("Emmiting");
    try {
      const url = new URL(this.getURL(channel), this.config.remoteAdminURL);
      const method = this.getMethod(channel);
      const token = this.getAuthenticationToken(authData);
      if (method === "POST") {
        const response = await axios.post(url.toString(), data, {
          headers: { Authorization: token },
        });
        return response.data;
      }
      if (method === "GET") {
        const response = await axios.get(url.toString(), {
          headers: { Authorization: token },
          data,
        });
        return response.data;
      }
    } catch (e) {
      if (throwError) {
        throw e;
      }
      Logger.error(`${e}: ${e.data}`);
    }
  }

  /**
   * Get returned url
   * @param channel
   * @private
   */
  private getURL(channel: Channel): string {
    if (channel === Channel.nodeInfo) {
      return "/api/v1/device/status/send-status";
    }
    if (channel === Channel.requestJob) {
      return "/api/v1/device/job/get-job";
    }
    if (channel === Channel.submitResult) {
      return "/api/v1/device/result/submit-result";
    }
    if (channel === Channel.health) {
      return "/api/v1/health";
    }
    throw Error();
  }

  // eslint-disable-next-line consistent-return
  private getMethod(channel: Channel): HTTPMethod {
    if (channel === Channel.nodeInfo) {
      return HTTPMethod.POST;
    }
    if (channel === Channel.requestJob) {
      return HTTPMethod.GET;
    }
    if (channel === Channel.submitResult) {
      return HTTPMethod.POST;
    }
    if (channel === Channel.health) {
      return HTTPMethod.GET;
    }
  }

  private getAuthenticationToken(authData: string) {
    const jwtToken = jwt.sign(
      { user: authData },
      this.config.remoteAdminPassword
    );
    return `Bearer ${jwtToken}`;
  }
}
