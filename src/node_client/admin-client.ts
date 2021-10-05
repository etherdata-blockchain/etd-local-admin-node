import axios from "axios";
import jwt from "jsonwebtoken"
import {Config} from "../config";
import Logger from "../logger";

type Channel = "node-info" | "request-job" | "submit-result"

export class RemoteAdminClient {
    config = Config.fromEnvironment()

    private getURL(channel: Channel) {
        if (channel === "node-info") {
            return "/api/v1/send_status"
        } else if (channel === "request-job") {
            return "/api/v1/jobs"
        } else if (channel === "submit-result") {
            return "/api/v1/result"
        }
    }

    private getMethod(channel: Channel) {
        if (channel === "node-info") {
            return "POST"
        } else if (channel === "request-job") {
            return "GET"
        } else if (channel === "submit-result") {
            return "POST"
        }
    }

    private getAuthenticationToken(authData: string) {
        const jwtToken = jwt.sign(authData, this.config.remoteAdminPassword)
        return `Bearer ${jwtToken}`;
    }

    async emit(channel: Channel, data: any, authData: string) {
        try{
            const url = this.getURL(channel)
            const method = this.getMethod(channel)
            const token = this.getAuthenticationToken(authData)
            if (method === "POST") {
                await axios.post(url, data, {headers: {"Authorization": token}})
            } else if (method === "GET") {
                await axios.get(url, {headers: {"Authorization": token}})
            }
        } catch (e) {
            Logger.error(`Cannot send data to ${channel} due to ${e}`)
        }


    }
}