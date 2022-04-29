// eslint-disable-next-line no-shadow
export enum RegisteredHandler {
  jobHandler = "job-handler",
  statusHandler = "status-handler",
  testHandler = "test-handler",
}

export enum RegisteredService {
  requestJobService = "request-job-service",
  web3JobService = "web-three-job-service",
  dockerJobService = "docker-job-service",
  updateTemplateJobService = "update-template-job-service",
  dockerStatusService = "docker-status-service",
  web3StatusService = "web-3-status-service",
  nodeInfoService = "node-info-service",
  networkStatusService = "network-status-service",
}

export enum JobName {
  updateStatus = "updateStatus",
}
