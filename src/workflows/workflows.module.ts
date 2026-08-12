import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkflowsService } from './workflows.service';
import { WorkflowsResolver } from './workflows.resolver';
import { WorkflowEngineService } from './workflow-engine.service';
import { Workflow } from './entities/workflow.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Workflow])],
  providers: [WorkflowsResolver, WorkflowsService, WorkflowEngineService],
  exports: [WorkflowsService, WorkflowEngineService],
})
export class WorkflowsModule {}
