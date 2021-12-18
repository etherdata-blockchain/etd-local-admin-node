import Docker, { Image } from "dockerode";
import { ImageStack } from "../stack/image";
import { ContainerStack } from "../stack/container";
import { Configurations } from "../const/configurations";

export default class DockerService {
  docker: Docker;

  constructor(docker?: Docker) {
    this.docker = docker ?? new Docker();
  }

  /**
   * Pull images
   * @param newImages a list of images
   * @param depth Maximum rollback depth. If depth exceeds, then the rollback operation will abort
   */
  async pullImages(newImages: ImageStack[], depth = 0) {
    // eslint-disable-next-line no-console
    console.log("Start images pulling process");
    for (const nim of newImages) {
      try {
        const image: Image = await this.docker.pull(`${nim.image}:${nim.tag}`);
        nim.imageId = image.id;
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log(
          `Cannot pull image ${nim.image} because ${e}. Rolling back.`
        );
        if (depth < Configurations.maximumRollbackDepth) {
          await this.removeImages(newImages, depth + 1);
        }

        throw e;
      }
    }
  }

  /**
   * Remove list of images
   * @param removedImages a list of images
   * @param depth Maximum rollback depth. If depth exceeds, then the rollback operation will abort
   */
  async removeImages(removedImages: ImageStack[], depth = 0) {
    if (depth > Configurations.maximumRollbackDepth) {
      throw new Error("Exceeds the maximum rollback depth. Abort!");
    }
    // eslint-disable-next-line no-console
    console.log("Start images removal process");

    for (const rmi of removedImages) {
      try {
        const image = this.docker.getImage(`${rmi.image}:${rmi.tag}`);
        await image.remove();
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log(`Cannot remove image ${rmi.image} because ${e}`);
        throw e;
      }
    }
  }

  async removeContainers(removeContainers: ContainerStack[], depth = 0) {
    // eslint-disable-next-line no-console
    console.log("Starting container removal process");
    for (const rmc of removeContainers) {
      try {
        const container = this.docker.getContainer(rmc.containerId!);
        await container.remove({ force: true });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log(
          `Cannot remove container ${rmc.containerName} because ${e}`
        );
        if (depth < Configurations.maximumRollbackDepth) {
          await this.createContainers(removeContainers, depth + 1);
        }
        throw e;
      }
    }
  }

  /**
   * Create list of containers
   * @param newContainers a list of images
   * @param depth Maximum rollback depth. If depth exceeds, then the rollback operation will abort
   */
  async createContainers(newContainers: ContainerStack[], depth = 0) {
    // eslint-disable-next-line no-console
    console.log("Starting container creation process");

    for (const newContainer of newContainers) {
      try {
        const container = await this.docker.createContainer({
          name: newContainer.containerName,
          Image: `${newContainer.image.image}:${newContainer.image.tag}`,
          ...newContainer.config,
        });
        newContainer.containerId = container.id;
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log(
          `Cannot remove container ${newContainer.containerName} because ${e}. Rolling back.`
        );
        if (depth < Configurations.maximumRollbackDepth) {
          await this.removeContainers(newContainers, depth + 1);
        }
        throw e;
      }
    }
  }
}
