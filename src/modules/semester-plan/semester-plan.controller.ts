import { Controller } from '@nestjs/common';
import { SemesterPlanService } from './semester-plan.service';

@Controller('semester-plan')
export class SemesterPlanController {
  constructor(private readonly semesterPlanService: SemesterPlanService) {}
}
