import Logger from "@etherdata-blockchain/logger";
import HTTPMethod from "http-method-enum";
import { interfaces } from "@etherdata-blockchain/common";
import { Config } from "../config";
import { Channel } from "./enums/channels";
import { Urls } from "./enums/urls";

export class RemoteAdminClient {
  config = Config.fromEnvironment();

  // eslint-disable-next-line consistent-return
  async emit<T>(
    channel: Channel,
    data: T,
    authData: string,
    throwError?: boolean
  ) {
    try {
      const url = new URL(this.getURL(channel), this.config.remoteAdminURL);
      const method = this.getMethod(channel);
      const client = this.config.getAxios();

      if (method === HTTPMethod.POST) {
        const response = await client.post(url.toString(), data);
        return response.data;
      }
      if (method === HTTPMethod.GET) {
        const response = await client.get(url.toString(), {
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

  async getUpdateTemplate(
    templateId: string
  ): Promise<interfaces.db.UpdateTemplateWithDockerImageDBInterface> {
    const url = new URL(
      this.getURL(Channel.updateTemplate),
      this.config.remoteAdminURL
    );
    const result = await this.config
      .getAxios()
      .get(`${url.toString()}/${templateId}`);
    return result.data;
  }

  /**
   * Get returned url
   * @param channel
   * @private
   */
  private getURL(channel: Channel): string {
    if (channel === Channel.nodeInfo) {
      return Urls.status;
    }
    if (channel === Channel.requestJob) {
      return Urls.job;
    }
    if (channel === Channel.submitResult) {
      return Urls.result;
    }
    if (channel === Channel.health) {
      return Urls.health;
    }

    if (channel === Channel.updateTemplate) {
      return Urls.update;
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

    if (channel === Channel.updateTemplate) {
      return HTTPMethod.GET;
    }
  }
}
