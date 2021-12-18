import { Stack, StackInterface } from "./internal/stack/stack";
import { ExecutionPlan } from "./internal/executionPlan/execution_plan";
import DockerService from "./internal/services/docker";

export class DockerPlan {
  stack: Stack;

  executionPlan: ExecutionPlan;

  constructor(dockerService: DockerService) {
    this.stack = new Stack();
    this.executionPlan = new ExecutionPlan(dockerService);
  }

  async create(stack: StackInterface): Promise<void> {
    this.stack.readPreviousStack();
    this.stack.updateStack(stack);
    this.executionPlan.create(this.stack);
  }

  async apply(): Promise<void> {
    const success = await this.executionPlan.apply();
    if (success) {
      this.stack.writeStack();
    }
  }
}
