import express from 'express';
import {
  IPaginationOptions,
  PaginationTypeEnum,
} from 'nestjs-typeorm-paginate';

export class Pagination {
  public static readonly limit_page_size: number = 100;

  /**
   * Apply pagination
   * @param req
   * @param res
   * @returns
   */
  public static paginate(
    req: express.Request,
    res: express.Response,
  ): Promise<IPaginationOptions> {
    return new Promise<IPaginationOptions>((resolve, reject) => {
      let page: number;
      let pageSize: number;

      if (req.query.page !== undefined && Number(req.query.page) !== 0) {
        if (!Pagination.isPositiveInteger(req.query.page.toString())) {
          res
            .status(400)
            .send(
              `Invalid value for parameter 'page': ${req.query.page.toString()}`,
            );
          return;
        }
        page = Number(req.query.page.toString());
      } else page = 1;

      if (req.query.pageSize !== undefined) {
        if (!Pagination.isPositiveInteger(req.query.pageSize.toString())) {
          res
            .status(400)
            .send(
              `Invalid value for parameter 'pageSize': ${req.query.pageSize.toString()}`,
            );
          return;
        }
        pageSize = Number(req.query.pageSize.toString());
        if (pageSize > Pagination.limit_page_size) {
          res
            .status(400)
            .send(`Page size cannot be a number greater than 100: ${pageSize}`);
          return;
        }
      } else pageSize = 10;

      let paginationOption: IPaginationOptions = {
        page: page,
        limit: pageSize,
        paginationType: PaginationTypeEnum.LIMIT_AND_OFFSET,
      };
      return resolve(paginationOption);
    });
  }

  /**
   * Check whether the string is a integer.
   * @param value
   */
  public static isInteger(value: string): boolean {
    return /^[+\-]?([0-9]+)$/.test(value);
  }

  /**
   * Check whether the string is a positive integer.
   * @param value
   */
  public static isPositiveInteger(value: string): boolean {
    return /^(\+)?([0-9]+)$/.test(value);
  }

  /**
   * Check whether the string is a negative integer.
   * @param value
   */
  public static isNegativeInteger(value: string): boolean {
    return /^\-([0-9]+)$/.test(value);
  }
}
