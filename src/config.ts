interface NamedParam
{
    rpc: string
    wsRpc: string;
    remoteAdminWebsocket: string
    remoteAdminPassword: string
    nodeName: string;
    nodeId: string
}

export class Config
{
    rpc: string
    wsRpc: string;
    remoteAdminWebsocket: string
    remoteAdminPassword: string
    nodeName: string;
    nodeId: string

    constructor({rpc, wsRpc, remoteAdminPassword, remoteAdminWebsocket, nodeId, nodeName}: NamedParam)
    {

        this.remoteAdminPassword = remoteAdminPassword
        this.remoteAdminWebsocket = remoteAdminWebsocket
        this.rpc = rpc
        this.wsRpc = wsRpc
        this.nodeId = nodeId
        this.nodeName = nodeName
    }

    /**
     * Get configuration from environment
     */
    static fromEnvironment()
    {
        return new Config({
            wsRpc: process.env.wsRpc!,
            rpc: process.env.rpc!,
            remoteAdminWebsocket: process.env.remoteAdminWebsocket!,
            remoteAdminPassword: process.env.remoteAdminPassword!,
            nodeName: process.env.etd_node_name!,
            nodeId: process.env.etd_node_id!
        });
    }
}