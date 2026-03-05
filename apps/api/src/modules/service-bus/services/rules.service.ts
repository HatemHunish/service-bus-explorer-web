import { Injectable, NotFoundException } from '@nestjs/common';
import { ConnectionsService } from '../../connections/connections.service';
import { AzureClientFactory } from '../../connections/azure-client.factory';
import { IRule, CreateRuleDto } from '@service-bus-explorer/shared';

@Injectable()
export class RulesService {
  constructor(
    private readonly connectionsService: ConnectionsService,
    private readonly azureClientFactory: AzureClientFactory,
  ) {}

  private getAdminClient() {
    const connection = this.connectionsService.getActiveConnectionOrThrow();
    return this.azureClientFactory.createServiceBusClients(connection).adminClient;
  }

  async findAll(topicName: string, subscriptionName: string): Promise<IRule[]> {
    const adminClient = this.getAdminClient();
    const rules: IRule[] = [];

    for await (const rule of adminClient.listRules(topicName, subscriptionName)) {
      rules.push({
        name: rule.name,
        filter: rule.filter as any,
        action: rule.action as any,
        createdAt: new Date(),
      });
    }

    return rules;
  }

  async findOne(topicName: string, subscriptionName: string, ruleName: string): Promise<IRule> {
    const adminClient = this.getAdminClient();

    try {
      const rule = await adminClient.getRule(topicName, subscriptionName, ruleName);

      return {
        name: rule.name,
        filter: rule.filter as any,
        action: rule.action as any,
        createdAt: new Date(),
      };
    } catch (error: any) {
      if (error.code === 'MessagingEntityNotFound') {
        throw new NotFoundException(`Rule '${ruleName}' not found`);
      }
      throw error;
    }
  }

  async create(topicName: string, subscriptionName: string, dto: CreateRuleDto): Promise<IRule> {
    const adminClient = this.getAdminClient();

    let filter: any;
    if (dto.filter.type === 'sql' && dto.filter.sqlExpression) {
      filter = { sqlExpression: dto.filter.sqlExpression };
    } else if (dto.filter.type === 'correlation' && dto.filter.correlationFilter) {
      filter = dto.filter.correlationFilter;
    } else if (dto.filter.type === 'true') {
      filter = { sqlExpression: '1=1' };
    } else if (dto.filter.type === 'false') {
      filter = { sqlExpression: '1=0' };
    } else {
      filter = { sqlExpression: '1=1' };
    }

    if (dto.action?.sqlExpression) {
      await adminClient.createRule(topicName, subscriptionName, dto.name, filter, { sqlExpression: dto.action.sqlExpression });
    } else {
      await adminClient.createRule(topicName, subscriptionName, dto.name, filter);
    }

    return this.findOne(topicName, subscriptionName, dto.name);
  }

  async remove(topicName: string, subscriptionName: string, ruleName: string): Promise<void> {
    const adminClient = this.getAdminClient();

    try {
      await adminClient.deleteRule(topicName, subscriptionName, ruleName);
    } catch (error: any) {
      if (error.code === 'MessagingEntityNotFound') {
        throw new NotFoundException(`Rule '${ruleName}' not found`);
      }
      throw error;
    }
  }
}
