import { Module } from '@nestjs/common';
import { FlightStatusService } from './flight-status.service';

@Module({
    providers: [FlightStatusService],
    exports: [FlightStatusService],
})
export class FlightStatusModule {}
