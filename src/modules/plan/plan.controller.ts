import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BasePlanDto } from './commons/plan.dtos';
import { CurrentUser } from './../common/decorator/current-user.decorator';
import { PlanService } from './plan.service';
import { Response } from 'express';
import { ResponseCode, ResponseMessage } from '../../utils/enum';
import { Plan } from './plan.entity';

@Controller('api/plan')
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  @Post()
  public async createPlan(
    @Body() payload: BasePlanDto,
    @Res() res: Response,
  ): Promise<Response> {
    const makePlan = new Plan().fromDto(payload);
    const plan = await this.planService.createPlan(makePlan);
    return res.status(ResponseCode.CREATED_SUCCESSFULLY).send({
      statusCode: ResponseCode.CREATED_SUCCESSFULLY,
      data: plan,
      message: ResponseMessage.CREATED_SUCCESSFULLY,
    });
  }
}
