import { Module } from '@nestjs/common';
import { ProfesoresController } from './profesores.controller.js';
import { ProfesoresService } from './profesores.service.js';

@Module({
  controllers: [ProfesoresController],
  providers: [ProfesoresService],
})
export class ProfesoresModule {}
