import { JobTaskType } from "@etherdata-blockchain/common/dist/enums";
import { Web3JobService } from "../../src/internal/services/job/web3_job_service";

describe("Given a general service", () => {
  test("When calling can handler", () => {
    const jobService = new Web3JobService();
    expect(jobService.canHandle(JobTaskType.Web3)).toBeTruthy();
    expect(jobService.canHandle(JobTaskType.Docker)).toBeFalsy();
  });
});
