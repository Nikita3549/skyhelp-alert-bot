import { HttpStatus, Injectable } from '@nestjs/common';
import { HealthStatus } from './enums/health-status.enum';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { ExternalApis } from './enums/external-apis.enum';

@Injectable()
export class ExternalApiService {
    constructor(private readonly configService: ConfigService) {}

    async externalApisStatus(): Promise<
        { api: ExternalApis; status: HealthStatus }[]
    > {
        return [
            {
                api: ExternalApis.CHISINAU_AIRPORT_API,
                status: await this.chisinauAirportApiHealth(),
            },
            {
                api: ExternalApis.FLIGHT_API,
                status: await this.flightIoHealth(),
            },
            {
                api: ExternalApis.FLIGHT_AWARE,
                status: await this.flightAwareHealth(),
            },
            {
                api: ExternalApis.METAR_API,
                status: await this.metarHealth(),
            },
        ];
    }

    private async metarHealth(): Promise<HealthStatus> {
        try {
            const { data } = await axios.get(
                `${this.configService.getOrThrow('METAR_URL')}/metar`,
                {
                    params: {
                        api_key: this.configService.getOrThrow('METAR_API_KEY'),
                        id: 'LUKK',
                        time: '2025-12-08T23:07:05Z',
                    },
                },
            );

            if (!data?.status) {
                return HealthStatus.FAILED;
            }

            return HealthStatus.OK;
        } catch (e) {
            console.log(JSON.stringify(e, null, 2));
            return HealthStatus.FAILED;
        }
    }

    private async chisinauAirportApiHealth(): Promise<HealthStatus> {
        try {
            const res = await axios.get(
                `${this.configService.getOrThrow('CHISINAU_AIRPORT_API_URL')}/flights`,
                {
                    params: {
                        flight_no: `W9 5482`,
                        date: '2026-01-27',
                        airline: 'W9',
                    },
                },
            );
            const flights = res.data.data;

            const flight = flights.at(-1);

            if (!flight) {
                return HealthStatus.FAILED;
            }

            return HealthStatus.OK;
        } catch (e) {
            console.log(JSON.stringify(e, null, 2));
            return HealthStatus.FAILED;
        }
    }

    private async flightIoHealth(): Promise<HealthStatus> {
        try {
            const res = await axios.get(
                `${this.configService.getOrThrow('FLIGHT_IO_URL')}/trackbyroute/${this.configService.getOrThrow('FLIGHT_IO_ACCESS_TOKEN')}?date=20260103&airport1=RMO&airport2=SOF`,
            );

            if (res.status == HttpStatus.OK) {
                return HealthStatus.OK;
            }
            return HealthStatus.FAILED;
        } catch (e) {
            console.log(JSON.stringify(e, null, 2));
            return HealthStatus.FAILED;
        }
    }
    private async flightAwareHealth(): Promise<HealthStatus> {
        try {
            const res = await axios.get(
                `${this.configService.getOrThrow('FLIGHTAWARE_BASE_URL')}/history/flights/WMT3926?start=2025-12-15T00:00:00Z&end=2025-12-15T23:59:59Z`,
                {
                    headers: {
                        'x-apikey': this.configService.getOrThrow(
                            'FLIGHTAWARE_API_KEY',
                        ),
                    },
                },
            );

            if (res.status == HttpStatus.OK) {
                return HealthStatus.OK;
            }
            return HealthStatus.FAILED;
        } catch (e) {
            console.log(JSON.stringify(e, null, 2));
            return HealthStatus.FAILED;
        }
    }
}
