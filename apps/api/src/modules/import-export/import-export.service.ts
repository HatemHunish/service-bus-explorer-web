import { Injectable } from '@nestjs/common';
import { QueuesService } from '../service-bus/services/queues.service';
import { TopicsService } from '../service-bus/services/topics.service';
import { SubscriptionsService } from '../service-bus/services/subscriptions.service';
import { RulesService } from '../service-bus/services/rules.service';

export interface ExportData {
  version: string;
  exportedAt: string;
  namespace: string;
  queues: any[];
  topics: any[];
  subscriptions: any[];
  rules: any[];
}

@Injectable()
export class ImportExportService {
  constructor(
    private readonly queuesService: QueuesService,
    private readonly topicsService: TopicsService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly rulesService: RulesService,
  ) {}

  async exportAll(): Promise<ExportData> {
    const queues = await this.queuesService.findAll();
    const topics = await this.topicsService.findAll();

    const subscriptions: any[] = [];
    const rules: any[] = [];

    for (const topic of topics) {
      const topicSubs = await this.subscriptionsService.findAll(topic.name);
      subscriptions.push(...topicSubs.map((s) => ({ ...s, topicName: topic.name })));

      for (const sub of topicSubs) {
        const subRules = await this.rulesService.findAll(topic.name, sub.subscriptionName);
        rules.push(
          ...subRules.map((r) => ({
            ...r,
            topicName: topic.name,
            subscriptionName: sub.subscriptionName,
          })),
        );
      }
    }

    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      namespace: '', // Will be filled by caller
      queues,
      topics,
      subscriptions,
      rules,
    };
  }

  async exportToXml(): Promise<string> {
    const data = await this.exportAll();

    // Simple XML generation
    let xml = `<?xml version="1.0" encoding="utf-8"?>\n`;
    xml += `<Entities xmlns="http://schemas.microsoft.com/servicebusexplorer" version="${data.version}" exportedAt="${data.exportedAt}">\n`;

    // Queues
    xml += `  <Queues>\n`;
    for (const queue of data.queues) {
      xml += `    <Queue name="${queue.name}">\n`;
      xml += `      <MaxSizeInMegabytes>${queue.maxSizeInMegabytes}</MaxSizeInMegabytes>\n`;
      xml += `      <RequiresDuplicateDetection>${queue.requiresDuplicateDetection}</RequiresDuplicateDetection>\n`;
      xml += `      <RequiresSession>${queue.requiresSession}</RequiresSession>\n`;
      xml += `      <DefaultMessageTimeToLive>${queue.defaultMessageTimeToLive}</DefaultMessageTimeToLive>\n`;
      xml += `      <MaxDeliveryCount>${queue.maxDeliveryCount}</MaxDeliveryCount>\n`;
      xml += `      <EnablePartitioning>${queue.enablePartitioning}</EnablePartitioning>\n`;
      xml += `    </Queue>\n`;
    }
    xml += `  </Queues>\n`;

    // Topics
    xml += `  <Topics>\n`;
    for (const topic of data.topics) {
      xml += `    <Topic name="${topic.name}">\n`;
      xml += `      <MaxSizeInMegabytes>${topic.maxSizeInMegabytes}</MaxSizeInMegabytes>\n`;
      xml += `      <RequiresDuplicateDetection>${topic.requiresDuplicateDetection}</RequiresDuplicateDetection>\n`;
      xml += `      <DefaultMessageTimeToLive>${topic.defaultMessageTimeToLive}</DefaultMessageTimeToLive>\n`;
      xml += `      <EnablePartitioning>${topic.enablePartitioning}</EnablePartitioning>\n`;
      xml += `    </Topic>\n`;
    }
    xml += `  </Topics>\n`;

    // Subscriptions
    xml += `  <Subscriptions>\n`;
    for (const sub of data.subscriptions) {
      xml += `    <Subscription name="${sub.subscriptionName}" topicName="${sub.topicName}">\n`;
      xml += `      <LockDuration>${sub.lockDuration}</LockDuration>\n`;
      xml += `      <RequiresSession>${sub.requiresSession}</RequiresSession>\n`;
      xml += `      <MaxDeliveryCount>${sub.maxDeliveryCount}</MaxDeliveryCount>\n`;
      xml += `    </Subscription>\n`;
    }
    xml += `  </Subscriptions>\n`;

    // Rules
    xml += `  <Rules>\n`;
    for (const rule of data.rules) {
      xml += `    <Rule name="${rule.name}" topicName="${rule.topicName}" subscriptionName="${rule.subscriptionName}">\n`;
      if (rule.filter?.sqlExpression) {
        xml += `      <SqlFilter>${this.escapeXml(rule.filter.sqlExpression)}</SqlFilter>\n`;
      }
      if (rule.action?.sqlExpression) {
        xml += `      <SqlAction>${this.escapeXml(rule.action.sqlExpression)}</SqlAction>\n`;
      }
      xml += `    </Rule>\n`;
    }
    xml += `  </Rules>\n`;

    xml += `</Entities>`;

    return xml;
  }

  async exportToJson(): Promise<string> {
    const data = await this.exportAll();
    return JSON.stringify(data, null, 2);
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  // TODO: Implement import functionality
  async importFromXml(xml: string): Promise<{ imported: number; errors: string[] }> {
    // Parse XML and create entities
    return { imported: 0, errors: ['Import not yet implemented'] };
  }

  async importFromJson(json: string): Promise<{ imported: number; errors: string[] }> {
    // Parse JSON and create entities
    return { imported: 0, errors: ['Import not yet implemented'] };
  }
}
