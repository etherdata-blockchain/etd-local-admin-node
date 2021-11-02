interface NamedParam {
  rpc: string;
  remoteAdminURL: string;
  remoteAdminPassword: string;
  nodeName: string;
  nodeId: string;
}

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
}
