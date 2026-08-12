import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { WorkflowsService } from './workflows.service';
import { Workflow } from './entities/workflow.entity';

@Resolver(() => Workflow)
export class WorkflowsResolver {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Query(() => [Workflow], { name: 'workflows' })
  findAll() {
    return this.workflowsService.findAll();
  }

  @Query(() => Workflow, { name: 'workflow' })
  findOne(@Args('id', { type: () => ID }) id: string) {
    return this.workflowsService.findOne(id);
  }

  // Define proper DTOs in a real app, here we use any for brevity
  @Mutation(() => Workflow)
  createWorkflow(
    @Args('name') name: string,
    @Args('triggerType') triggerType: string,
  ) {
    return this.workflowsService.create({ name, triggerType, isActive: true, actions: [] });
  }

  @Mutation(() => Boolean)
  removeWorkflow(@Args('id', { type: () => ID }) id: string) {
    return this.workflowsService.remove(id);
  }
}
