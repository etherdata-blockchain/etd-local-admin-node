import axios from "axios";
import { enums } from "@etherdata-blockchain/common";
import { Web3JobService } from "../../../internal/services/job/web3_job_service";
import { MockBlockNumber, MockError } from "../../mockdata";
import { CoinbaseHandler } from "../../../internal/utils/command";

jest.mock("axios");
jest.mock("../../../internal/utils/command", () => ({
  CoinbaseHandler: jest.fn().mockImplementation(function () {
    this.handle = jest.fn(() => "abc=abc");
    this.canHandle = jest.fn().mockResolvedValueOnce(true);
  }),
}));

const MockDataWeb3Calling: enums.Web3ValueType = {
  method: "",
  params: [],
};

describe("Given a web3 job service", () => {
  test("When calling without any error", async () => {
    (axios.post as any).mockResolvedValueOnce({
      data: {
        result: [MockBlockNumber.one],
      },
    });
    const web3Service = new Web3JobService();
    const result = await web3Service.handle(MockDataWeb3Calling);
    expect(result[0]).toStrictEqual([MockBlockNumber.one]);
    expect(result[1]).toBeUndefined();
  });

  test("When calling with coinbase handler", async () => {
    (axios.post as any).mockResolvedValueOnce({
      data: {
        result: [MockBlockNumber.one],
      },
    });
    const web3Service = new Web3JobService();
    const result = await web3Service.handle(MockDataWeb3Calling);
    const mockCoinbaseHandler = (CoinbaseHandler as any).mock.instances[0];

    expect(mockCoinbaseHandler.handle).toBeCalled();
    expect(result[0]).toStrictEqual([MockBlockNumber.one]);
    expect(result[1]).toBeUndefined();
  });

  test("When calling with error", async () => {
    (axios.post as any).mockResolvedValueOnce({
      data: {
        error: { message: MockError.rpcConnectionError },
      },
    });
    const web3Service = new Web3JobService();
    const result = await web3Service.handle(MockDataWeb3Calling);
    expect(result[0]).toBeUndefined();
    expect(result[1]).toBe(MockError.rpcConnectionError);
  });
});
