import { Injectable } from '@nestjs/common';
import Bull, { Queue } from 'bull';
import { WinstonLoggerService } from '../../observability/logger/winston-logger.service';

@Injectable()
export class BullMQService {
  private queues: Map<string, Queue> = new Map();

  constructor(private readonly logger: WinstonLoggerService) {}

  async registerQueue(queueName: string, queue: Queue): Promise<void> {
    this.queues.set(queueName, queue);
    this.logger.log(`Registered queue: ${queueName}`, 'BullMQService');
  }

  getQueue(queueName: string): Queue | undefined {
    return this.queues.get(queueName);
  }

  async addJob<T>(
    queueName: string,
    jobName: string,
    data: T,
    options?: any,
  ): Promise<void> {
    const queue = this.getQueue(queueName);

    if (!queue) {
      this.logger.error(
        `Queue ${queueName} not found`,
        undefined,
        'BullMQService',
      );
      throw new Error(`Queue ${queueName} not found`);
    }

    try {
      await queue.add(jobName, data, options);
      this.logger.log(
        `Added job ${jobName} to queue ${queueName}`,
        'BullMQService',
      );
    } catch (error) {
      this.logger.error(
        `Error adding job ${jobName} to queue ${queueName}: ${error.message}`,
        error.stack,
        'BullMQService',
      );
      throw error;
    }
  }

  async getJobCounts(queueName: string): Promise<Bull.JobCounts> {
    const queue = this.getQueue(queueName);

    if (!queue) {
      this.logger.error(
        `Queue ${queueName} not found`,
        undefined,
        'BullMQService',
      );
      throw new Error(`Queue ${queueName} not found`);
    }

    try {
      return await queue.getJobCounts();
    } catch (error) {
      this.logger.error(
        `Error getting job counts for queue ${queueName}: ${error.message}`,
        error.stack,
        'BullMQService',
      );
      throw error;
    }
  }
}
