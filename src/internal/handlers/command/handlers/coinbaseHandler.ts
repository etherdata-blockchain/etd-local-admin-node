import {CommandHandler, RemoteCommand} from "../commandHandler";
import fs                              from "fs"
import dotenv from "dotenv"

interface Data{
    newCoinbase: string
}

export class CoinbaseHandler extends CommandHandler<Data>{
    supportCommand: string = "miner_setEtherbase";

    private generateEnv(object: {[key: string]: string}): string{
        let out = ""
        for(const [key, value] of Object.entries(object)){
            out += `${key}=${value}\n`
        }
        return out;
    }

    /**
     * Set local env's etd_coinbase field to the latest coinbase
     * @param data
     */
    async handle({data}: RemoteCommand<Data>): Promise<string>
    {
        const file = fs.readFileSync("./.env")
        const config = dotenv.parse(file)
        config.etd_coinbase = data.newCoinbase

        const newEnv = this.generateEnv(config)
        fs.writeFileSync("./.env", newEnv)

        return newEnv
    }



}