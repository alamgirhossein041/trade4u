import { HttpException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Machine } from "modules/bot/machine.entity";
import { Repository } from "typeorm";
import { ResponseCode, ResponseMessage } from "utils/enum";
import { MachinePayload } from "./machine.payload";

@Injectable()
export class MachineService {
  constructor(
    @InjectRepository(Machine)
    private readonly machineRepository: Repository<Machine>,
  ) {}

  /**
   * Create new machine
   * @param payload
   * @returns
   */
  async createMachine(
    payload: MachinePayload,
  ) {
    return this.machineRepository.save(payload)
  }

  /**
   * Create new machine
   * @param payload
   * @returns
   */
   async getAllMachines(
  ) {
   const machines=await this.machineRepository.find({})
   if(!machines){
    throw new HttpException(
      ResponseMessage.CONTENT_NOT_FOUND,
      ResponseCode.CONTENT_NOT_FOUND,
    );
   }
    return machines
  }
}
