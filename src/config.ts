import axios from "axios";
import jwt from "jsonwebtoken";
import axiosRetry from "axios-retry";

interface NamedParam {
  rpc: string;
  remoteAdminURL: string;
  remoteAdminPassword: string;
  nodeName: string;
  nodeId: string;
}

export const DefaultSettings = {
  /**
   * Axios timeout in seconds
   */
  axiosTimeout: 8,
  /**
   * Status checking interval in seconds
   */
  statusInterval: 10,
  /**
   * Job checking interval in seconds
   */
  jobInterval: 10,
  /**
   * Number of axios request times
   */
  axiosRetryTimes: 4,
};

export class Config {
  rpc: string;

  remoteAdminURL: string;

  remoteAdminPassword: string;

  nodeName: string;

  nodeId: string;

  constructor({
    rpc,
    remoteAdminPassword,
    remoteAdminURL,
    nodeId,
    nodeName,
  }: NamedParam) {
    this.remoteAdminPassword = remoteAdminPassword;
    this.remoteAdminURL = remoteAdminURL;
    this.rpc = rpc;
    this.nodeId = nodeId;
    this.nodeName = nodeName;
  }

  /**
   * Get configuration from environment
   */
  static fromEnvironment() {
    return new Config({
      rpc: process.env.rpc!,
      remoteAdminURL: process.env.remoteAdminURL!,
      remoteAdminPassword: process.env.remoteAdminPassword!,
      nodeName: process.env.etd_node_name!,
      nodeId: process.env.etd_node_id!,
    });
  }

  getAxios() {
    const jwtToken = jwt.sign({ user: this.nodeId }, this.remoteAdminPassword);
    const token = `Bearer ${jwtToken}`;
    const client = axios.create({
      timeout: DefaultSettings.axiosTimeout * 1000,
      headers: { Authorization: token },
    });
    axiosRetry(client, {
      retries: DefaultSettings.axiosRetryTimes,
      retryDelay: axiosRetry.exponentialDelay,
      shouldResetTimeout: true,
    });
    return client;
  }
}
