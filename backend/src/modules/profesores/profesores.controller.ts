import { Controller, Get } from '@nestjs/common';
import { ProfesoresStatusDto } from './dto/profesores-status.dto.js';
import { ProfesoresService } from './profesores.service.js';

@Controller('profesores')
export class ProfesoresController {
  constructor(private readonly profesoresService: ProfesoresService) {}

  @Get('status')
  getStatus(): ProfesoresStatusDto {
    return this.profesoresService.getStatus();
  }
}
