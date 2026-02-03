import { Injectable } from '@nestjs/common';
import { IFlightStatusStats } from './interfaces/flight-status-stats.interface';
import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FlightStatusService {
    private readonly pool: Pool;
    constructor(private readonly configService: ConfigService) {
        this.pool = new Pool({
            host: configService.getOrThrow('PROD_DATABASE_HOST'),
            port: configService.getOrThrow('PROD_DATABASE_PORT'),
            database: configService.getOrThrow('PROD_DATABASE_DBNAME'),
            user: configService.getOrThrow('PROD_DATABASE_USER'),
            password: configService.getOrThrow('PROD_DATABASE_PASSWORD'),
        });
    }

    async getStats(): Promise<IFlightStatusStats> {
        const { rows } = await this.pool.query<{
            month: string;
            total: string;
        }>(
            `SELECT TRIM(TO_CHAR(requested_at, 'Month')) as month, COUNT(*) as total
             FROM stats_flight_status_requests
             GROUP BY month
             ORDER BY month DESC`,
        );
        const { rows: total } = await this.pool.query<{
            count: number;
        }>(`SELECT COUNT(*) FROM stats_flight_status_requests`);

        return {
            total: total[0].count,
            monthly: rows.map((r) => ({ month: r.month, amount: +r.total })),
        };
    }
}
