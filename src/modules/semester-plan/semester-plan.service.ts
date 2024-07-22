import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SemesterPlanEntity } from './entities/semester-plan.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SemesterPlanService {
    constructor(
        @InjectRepository(SemesterPlanEntity) private semesterPlanRepository: Repository<SemesterPlanEntity>
    ){}

    
}
