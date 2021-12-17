import {CoinbaseHandler} from "../../internal/handlers/command";
import fs           from "fs";

jest.mock("fs")

test("Test env", async ()=>{
    //@ts-ignore
    fs.readFileSync.mockReturnValue(new Buffer("etd_coinbase=a"))
    const coinbaseHandler = new CoinbaseHandler()
    const newEnv = await coinbaseHandler.handle({command: "", data: {newCoinbase: "abcde"}})
    expect(newEnv).toBe("etd_coinbase=abcde\n")
})


test("Test env when coinbase doesn't exist", async ()=>{
    //@ts-ignore
    fs.readFileSync.mockReturnValue(new Buffer("node_name=a"))
    const coinbaseHandler = new CoinbaseHandler()
    const newEnv = await coinbaseHandler.handle({command: "", data: {newCoinbase: "abcde"}})
    expect(newEnv).toBe("node_name=a\netd_coinbase=abcde\n")
})