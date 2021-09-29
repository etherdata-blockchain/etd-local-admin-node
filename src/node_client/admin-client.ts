import axios from "axios";

type Channel = "node-info" | "request-job" | "submit-result"

export class RemoteAdminClient {
    private getURL(channel: Channel) {
        if (channel === "node-info") {
            return "/api/v1/send_status"
        } else if (channel === "request-job"){
            return "/api/v1/jobs"
        } else if (channel === "submit-result"){
            return "/api/v1/result"
        }
    }

    async emit(channel: Channel, data: any, authData: string) {
        const url = this.getURL(channel)
        await axios.post(url, data)

    }
}