import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workflow } from './entities/workflow.entity';

@Injectable()
export class WorkflowsService {
  constructor(
    @InjectRepository(Workflow)
    private workflowsRepository: Repository<Workflow>,
  ) {}

  findAll() {
    return this.workflowsRepository.find();
  }

  findOne(id: string) {
    return this.workflowsRepository.findOne({ where: { id } });
  }

  create(workflowData: Partial<Workflow>) {
    const workflow = this.workflowsRepository.create(workflowData);
    return this.workflowsRepository.save(workflow);
  }

  async update(id: string, workflowData: Partial<Workflow>) {
    await this.workflowsRepository.update(id, workflowData);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.workflowsRepository.delete(id);
    return true;
  }
}
