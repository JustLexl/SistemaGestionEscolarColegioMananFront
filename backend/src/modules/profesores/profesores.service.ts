import { Injectable } from '@nestjs/common';
import { ProfesoresStatusDto } from './dto/profesores-status.dto.js';

@Injectable()
export class ProfesoresService {
  getStatus(): ProfesoresStatusDto {
    return new ProfesoresStatusDto();
  }
}
