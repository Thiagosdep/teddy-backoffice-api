import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WinstonLoggerService } from '../../observability/logger/winston-logger.service';
import * as amqplib from 'amqplib';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private connection: amqplib.ChannelModel;
  private channel: amqplib.Channel;

  constructor(
    private configService: ConfigService,
    private readonly logger: WinstonLoggerService,
  ) {}

  async onModuleInit() {
    await this.connectWithRetry();
  }

  private async connectWithRetry(retries = 5, delay = 5000) {
    let currentRetry = 0;

    while (currentRetry < retries) {
      try {
        const rabbitmqUrl = this.configService.get<string>('RABBITMQ_URL');

        if (!rabbitmqUrl) {
          throw new Error('RABBITMQ_URL is not defined in configuration');
        }

        this.logger.log(
          `Connecting to RabbitMQ at ${rabbitmqUrl} (attempt ${currentRetry + 1}/${retries})`,
          'RabbitMQService',
        );

        this.connection = await amqplib.connect(rabbitmqUrl);
        this.channel = await this.connection.createChannel();

        this.logger.log(
          'Successfully connected to RabbitMQ',
          'RabbitMQService',
        );

        this.connection.on('close', async () => {
          this.logger.warn(
            'RabbitMQ connection closed unexpectedly, attempting to reconnect...',
            'RabbitMQService',
          );
          await this.connectWithRetry();
        });

        return;
      } catch (error) {
        currentRetry++;

        if (currentRetry >= retries) {
          this.logger.error(
            `Failed to connect to RabbitMQ after ${retries} attempts: ${error.message}`,
            error.stack,
            'RabbitMQService',
          );
          throw error;
        }

        this.logger.warn(
          `Failed to connect to RabbitMQ: ${error.message}. Retrying in ${delay}ms...`,
          'RabbitMQService',
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  async onModuleDestroy() {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      this.logger.log('RabbitMQ connection closed', 'RabbitMQService');
    } catch (error) {
      this.logger.error(
        `Error closing RabbitMQ connection: ${error.message}`,
        error.stack,
        'RabbitMQService',
      );
    }
  }

  async assertQueue(queue: string, options?: any): Promise<any> {
    await this.ensureConnection();
    this.logger.log(`Asserting queue: ${queue}`, 'RabbitMQService');
    return this.channel.assertQueue(queue, options);
  }

  async assertExchange(
    exchange: string,
    type: string,
    options?: any,
  ): Promise<any> {
    await this.ensureConnection();
    this.logger.log(
      `Asserting exchange: ${exchange} of type ${type}`,
      'RabbitMQService',
    );
    return this.channel.assertExchange(exchange, type, options);
  }

  async bindQueue(
    queue: string,
    exchange: string,
    routingKey: string,
  ): Promise<any> {
    await this.ensureConnection();
    this.logger.log(
      `Binding queue ${queue} to exchange ${exchange} with routing key ${routingKey}`,
      'RabbitMQService',
    );
    return this.channel.bindQueue(queue, exchange, routingKey);
  }

  async publishToExchange(
    exchange: string,
    routingKey: string,
    content: any,
  ): Promise<boolean> {
    await this.ensureConnection();
    try {
      const message = Buffer.from(JSON.stringify(content));
      const result = this.channel.publish(exchange, routingKey, message, {
        persistent: true,
        contentType: 'application/json',
      });

      this.logger.log(
        `Published message to exchange ${exchange} with routing key ${routingKey}`,
        'RabbitMQService',
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Error publishing to exchange ${exchange}: ${error.message}`,
        error.stack,
        'RabbitMQService',
      );
      throw error;
    }
  }

  async sendToQueue(queue: string, content: any): Promise<boolean> {
    await this.ensureConnection();
    try {
      const message = Buffer.from(JSON.stringify(content));
      const result = this.channel.sendToQueue(queue, message, {
        persistent: true,
        contentType: 'application/json',
      });

      this.logger.log(`Sent message to queue ${queue}`, 'RabbitMQService');
      return result;
    } catch (error) {
      this.logger.error(
        `Error sending to queue ${queue}: ${error.message}`,
        error.stack,
        'RabbitMQService',
      );
      throw error;
    }
  }

  async consume(
    queue: string,
    callback: (msg: any) => void,
  ): Promise<amqplib.Replies.Consume> {
    await this.ensureConnection();
    this.logger.log(
      `Setting up consumer for queue ${queue}`,
      'RabbitMQService',
    );
    return this.channel.consume(queue, (msg) => {
      if (msg) {
        try {
          callback(msg);
          this.channel.ack(msg);
        } catch (error) {
          this.logger.error(
            `Error processing message from queue ${queue}: ${error.message}`,
            error.stack,
            'RabbitMQService',
          );
          this.channel.nack(msg, false, false);
        }
      }
    });
  }

  private async ensureConnection(): Promise<void> {
    if (!this.channel) {
      this.logger.log(
        'Channel not available, attempting to establish connection',
        'RabbitMQService',
      );
      await this.connectWithRetry(10, 3000);
    }
  }
}
