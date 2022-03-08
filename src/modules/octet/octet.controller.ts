import { Controller, Get, HttpException, Post, Query, Res, UseGuards } from '@nestjs/common';
import { OctetService } from './octet.service';

@Controller('api/octet')
export class OctetController {
  constructor(private readonly octetService: OctetService) { }
}
