import Logger from "@etherdata-blockchain/logger";
import { enums, interfaces } from "@etherdata-blockchain/common";
import { BaseHandler } from "../base_handler";
import { DockerJobService } from "../../services/job/docker_job_service";
import { Web3JobService } from "../../services/job/web3_job_service";
import { Channel } from "../../enums/channels";
import { UpdateTemplateJobService } from "../../services/job/update_template_job_service";
import { RequestJobService } from "../../services/job/request_job_service";
import {
  JobName,
  RegisteredHandler,
  RegisteredService,
} from "../../enums/names";
import { GeneralService, JobResult } from "../../services/general_service";

export class JobHandler extends BaseHandler {
  protected handlerName: RegisteredHandler = RegisteredHandler.jobHandler;

  private serviceJobTypeMapping: { [key: string]: GeneralService<any> } = {};

  constructor() {
    super();

    this.addService(new DockerJobService())
      .addService(new Web3JobService())
      .addService(new UpdateTemplateJobService())
      .addService(new RequestJobService());

    this.serviceJobTypeMapping[enums.JobTaskType.Docker] =
      this.findServiceByName(RegisteredService.dockerJobService);
    this.serviceJobTypeMapping[enums.JobTaskType.Web3] = this.findServiceByName(
      RegisteredService.web3JobService
    );
    this.serviceJobTypeMapping[enums.JobTaskType.UpdateTemplate] =
      this.findServiceByName(RegisteredService.updateTemplateJobService);
  }

  async startHandler(): Promise<void> {
    await super.startHandler();
    await this.startJobSystemConnection();
  }

  async handleJob(
    job: interfaces.db.PendingJobDBInterface<any> | JobName.updateStatus
  ): Promise<JobResult | undefined> {
    if (job === JobName.updateStatus) {
      const handler = this.findHandlerByName(RegisteredHandler.statusHandler);
      // we want to update the latest status
      return handler?.handleJob(RegisteredService.nodeInfoService);
    }
    await super.handleJob(job);
    const service = this.serviceJobTypeMapping[job.task.type];
    return service.handle(job.task.value);
  }

  private async startJobSystemConnection() {
    await this.tryConnect(
      async () => {
        await this.remoteClient.emit(Channel.health, "", "");
        return true;
      },
      async () => {
        Logger.error(`Cannot connect to remote admin server`);
      }
    );
    Logger.info("Connected to Admin server");
  }
}
