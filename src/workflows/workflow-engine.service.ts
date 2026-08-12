import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { WorkflowsService } from './workflows.service';

@Injectable()
export class WorkflowEngineService {
  private readonly logger = new Logger(WorkflowEngineService.name);

  constructor(private readonly workflowsService: WorkflowsService) {}

  @OnEvent('document.signed')
  async handleDocumentSigned(payload: any) {
    this.logger.log(`Document signed event received. Payload: ${JSON.stringify(payload)}`);
    // Example implementation: find all active workflows for 'DOCUMENT_SIGNED'
    const allWorkflows = await this.workflowsService.findAll();
    const activeWorkflows = allWorkflows.filter(
      (w) => w.isActive && w.triggerType === 'DOCUMENT_SIGNED',
    );

    for (const workflow of activeWorkflows) {
      this.logger.log(`Executing workflow: ${workflow.name}`);
      for (const action of workflow.actions) {
        await this.executeAction(action, payload);
      }
    }
  }

  private async executeAction(action: any, payload: any) {
    this.logger.log(`Executing action ${action.type} with target ${action.target}`);
    switch (action.type) {
      case 'SAVE_TO_DRIVE':
        this.logger.log(`Simulating Save to Google Drive for document id: ${payload?.documentId}`);
        break;
      case 'SLACK_ALERT':
        this.logger.log(`Simulating Slack Alert to ${action.target}: Document ${payload?.documentId} was signed.`);
        break;
      default:
        this.logger.warn(`Unknown action type: ${action.type}`);
    }
  }
}
