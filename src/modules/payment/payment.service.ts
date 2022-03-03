import { HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SeedService } from '../../modules/seed/seed.service';
import { Repository } from 'typeorm';
import { PaymentStatus } from './commons/payment.enum';
import { Payment } from './payment.entity';
import moment from 'moment';
import { SchedulerService } from '../../modules/scheduler/scheduler.service';
import bigDecimal from 'js-big-decimal';
import ShortUniqueId from 'short-unique-id';
import { User } from '../user';
import {
  paginate,
  Pagination,
  IPaginationOptions,
  PaginationTypeEnum,
} from 'nestjs-typeorm-paginate';
import { ResponseCode, ResponseMessage } from '../../utils/enum';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly seedService: SeedService,
  ) {}

  /**
   * Make payment
   */
  public async makePayment() {}

  /**
   * Get user payments
   */
  public async getPayments(user: User, paginationOption: IPaginationOptions) {
    const condition = { user: user };
    const payment = await this.paginate(paginationOption, condition);
    if (!payment.items.length) {
      throw new HttpException(
        `Payment ${ResponseMessage.CONTENT_NOT_FOUND}`,
        ResponseCode.CONTENT_NOT_FOUND,
      );
    }
    return { items: payment.items, meta: payment.meta };
  }

  /**
   * Create order for business plan
   * @param planId
   */
  public async orderPlan(user: User, planId: number): Promise<Payment> {
    return new Promise<Payment>(async (resolve, reject) => {
      try {
        const payment = await this.createPayment(user, planId);
        return resolve(await this.paymentRepository.save(payment));
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Create payment
   * @param planId
   * @returns
   */
  public async createPayment(user: User, planId: number) {
    const plan = await this.seedService.getPlanById(planId);
    const uid = new ShortUniqueId({ length: 10 });
    const payment = new Payment();
    payment.paymentId = uid();
    payment.amountUSD = plan.minUSDT;
    payment.status = PaymentStatus.PENDING;
    payment.createdAt = moment().unix();
    payment.expireAt = payment.createdAt + 3600; // one hour after creation
    payment.amountKLAY = Number(
      new bigDecimal(payment.amountUSD)
        .divide(new bigDecimal(SchedulerService.klayPrice), 4)
        .getValue(),
    );
    payment.plan = plan;
    payment.user = user;
    return payment;
  }

  /**
   * Paginate the payment list
   * @param options
   * @param condition
   * @param relations
   * @returns
   */
  private async paginate(
    options: IPaginationOptions,
    condition?: Object,
    relations?: string[],
  ): Promise<Pagination<Payment>> {
    return paginate<Payment>(this.paymentRepository, options, {
      order: { createdAt: 'DESC' },
      where: condition,
      relations: relations,
    });
  }
}
