import { Module } from '@nestjs/common';
import { ErpSyncService } from './erp-sync.service';

@Module({
  providers: [ErpSyncService],
  exports: [ErpSyncService],
})
export class ErpAdapterModule {}
