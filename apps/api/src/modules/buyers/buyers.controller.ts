import { Controller, Get, Put, Param, Body } from '@nestjs/common';
import { BuyersService } from './buyers.service';

import { IsString, IsOptional } from 'class-validator';

class UpsertBuyerProfileDto {
  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  contactName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  taxId?: string;

  @IsOptional()
  @IsString()
  email?: string;
}

@Controller('buyers')
export class BuyersController {
  constructor(private readonly buyersService: BuyersService) {}

  @Get(':groupId')
  async getBuyerProfile(@Param('groupId') groupId: string) {
    const profile = await this.buyersService.getBuyerProfile(groupId);
    return profile || {};
  }

  @Put(':groupId')
  async upsertBuyerProfile(
    @Param('groupId') groupId: string,
    @Body() dto: UpsertBuyerProfileDto,
  ) {
    return this.buyersService.upsertBuyerProfile(groupId, dto);
  }
}
