import { enums, interfaces } from "@etherdata-blockchain/common";
import {
  ContainerStack,
  DockerPlan,
  ImageStack,
} from "@etherdata-blockchain/docker-plan";
import DockerService from "@etherdata-blockchain/docker-plan/dist/internal/services/docker";
import { StackInterface } from "@etherdata-blockchain/docker-plan/dist/internal/stack/stack";
import { JobTaskType } from "@etherdata-blockchain/common/dist/enums";
import { GeneralService, JobResult } from "../general_service";

/**
 * Handle update template
 */
// eslint-disable-next-line max-len
export class UpdateTemplateJobService extends GeneralService<string> {
  targetJobTaskType = JobTaskType.UpdateTemplate;

  /**
   * Given a update template's value, return a update result
   * @param value
   */
  async handle(value: string): Promise<JobResult> {
    try {
      const updateTemplate = await this.remoteClient.getUpdateTemplate(value);

      const dockerService = new DockerService();
      const plan = new DockerPlan(dockerService);

      const images: ImageStack[] = updateTemplate.imageStacks.map((i) => ({
        image: i.imageName,
        tag: i.tags.tag,
      }));

      const containers: ContainerStack[] = updateTemplate.containerStacks.map(
        (c) => ({
          containerName: c.containerName,
          image: {
            image: c.image.imageName,
            tag: c.image.tags.tag,
          },
        })
      );

      const stacks: StackInterface = {
        update_time: new Date().toISOString(),
        images,
        containers,
      };

      await plan.create(stacks);
      await plan.apply();
      return { result: "success", error: undefined };
    } catch (err) {
      return { result: undefined, error: `${err}` };
    }
  }

  start(): Promise<any> {
    return Promise.resolve(undefined);
  }
}
