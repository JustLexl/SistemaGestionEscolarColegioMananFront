import { Injectable } from '@nestjs/common';
import { API_SERVICE_NAME } from '../../common/constants/app.constants.js';

export interface HealthStatus {
  status: 'ok';
  service: string;
}

@Injectable()
export class HealthService {
  getStatus(): HealthStatus {
    return {
      status: 'ok',
      service: API_SERVICE_NAME,
    };
  }
}
