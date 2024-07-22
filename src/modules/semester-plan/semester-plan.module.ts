import { Module } from '@nestjs/common';
import { SemesterPlanService } from './semester-plan.service';
import { SemesterPlanController } from './semester-plan.controller';

@Module({
  controllers: [SemesterPlanController],
  providers: [SemesterPlanService],
})
export class SemesterPlanModule {}
