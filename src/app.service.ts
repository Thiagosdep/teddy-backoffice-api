import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  healthCheck(): string {
    return 'ok';
  }

  healthCheckDown(): string {
    return 'down';
  }
}
