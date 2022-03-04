import { HttpException, Injectable, UseFilters } from '@nestjs/common';
import { Connection, getConnection, Repository } from 'typeorm';
import { LicenseFee } from './licensefee.entity';
import { Plan } from './plan.entity';
import { PerformanceFee } from './preformaceFee.entity';
import { default as licenseFee } from '../../utils/seed/licenseFee.json';
import { default as preformanceFee } from '../../utils/seed/preformanceFee.json';
import { default as plan } from '../../utils/seed/plan.json';
import { ResponseCode, ResponseMessage } from '../../utils/enum';
import { InjectRepository } from '@nestjs/typeorm';
import console from 'console';

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
    @InjectRepository(LicenseFee)
    private readonly licenseFeeRepository: Repository<LicenseFee>,
    @InjectRepository(PerformanceFee)
    private readonly preformanceFeeRepository: Repository<PerformanceFee>,
  ) {}

  /**
   * Insert seed data to the database
   * @returns
   */
  public static InsertSeed(): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      const connection = getConnection();
      const queryRunner = connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      try {
        await this.insertPlan(connection);
        await this.insertLicenseFee(connection);
        await this.insertPreformanceFee(connection);
        await queryRunner.commitTransaction();
        queryRunner.release();
        resolve();
      } catch (err) {
        await queryRunner.rollbackTransaction();
        queryRunner.release();
        reject(err);
      }
    });
  }

  /**
   * Insert business plan seed data to the database
   * @param conn
   * @returns
   */
  public static insertPlan(conn: Connection) {
    return new Promise<void>(async (resolve, reject) => {
      try {
        const planRepositrory = conn.getRepository(Plan);
        await planRepositrory
          .createQueryBuilder()
          .insert()
          .values(plan)
          .orIgnore()
          .execute();
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Insert license fee seed data to the database
   * @param conn
   * @returns
   */
  public static insertLicenseFee(conn: Connection) {
    return new Promise<void>(async (resolve, reject) => {
      try {
        const licenseFeeRepositrory = conn.getRepository(LicenseFee);
        await licenseFeeRepositrory
          .createQueryBuilder()
          .insert()
          .values(licenseFee)
          .orIgnore()
          .execute();

        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Insert preformance fee seed data to the database
   * @param conn
   * @returns
   */
  public static insertPreformanceFee(conn: Connection) {
    return new Promise<void>(async (resolve, reject) => {
      try {
        const preformaceFeeRepositrory = conn.getRepository(PerformanceFee);
        await preformaceFeeRepositrory
          .createQueryBuilder()
          .insert()
          .values(preformanceFee)
          .orIgnore()
          .execute();
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Get all business plan
   */
  async getBusinessPlans() {
    const plans = await this.planRepository.find();
    if (!plans.length) {
      throw new HttpException(
        ResponseMessage.CONTENT_NOT_FOUND,
        ResponseCode.CONTENT_NOT_FOUND,
      );
    }

    return plans;
  }

  /**
   * Get all business plan
   */
  async getPlanById(planId: number) {
    const plan = await this.planRepository.findOne({ planId });
    if (!plan) {
      throw new HttpException(
        ResponseMessage.DOES_NOT_EXIST,
        ResponseCode.CONTENT_NOT_FOUND,
      );
    }

    return plan;
  }

  /**
   * Get all license fee
   */
  async getlicenseFee() {
    const licenseFee = await this.licenseFeeRepository.find();
    if (!licenseFee.length) {
      throw new HttpException(
        ResponseMessage.CONTENT_NOT_FOUND,
        ResponseCode.CONTENT_NOT_FOUND,
      );
    }

    return licenseFee;
  }

  /**
   * Get all prefomance fee
   */
  async getpreformanceFee() {
    const preformaceFee = await this.preformanceFeeRepository.find();
    if (!preformanceFee.length) {
      throw new HttpException(
        ResponseMessage.CONTENT_NOT_FOUND,
        ResponseCode.CONTENT_NOT_FOUND,
      );
    }

    return preformaceFee;
  }
}
