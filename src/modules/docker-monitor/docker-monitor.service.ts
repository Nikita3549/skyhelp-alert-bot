import { Injectable, OnModuleInit } from '@nestjs/common';
import Docker from 'dockerode';
import { ConfigService } from '@nestjs/config';
import { DockerEvent } from './interfaces/docker-event.interface';
import { AlertService } from '../alert/alert.service';
import { UnhealthyContainerAlert } from '../alert/definitions/alerts/unhealthy-container.alert';
import { cleanDockerLogs } from './utils/clean-docker-logs.util';

@Injectable()
export class DockerMonitorService implements OnModuleInit {
    private readonly docker: Docker;
    constructor(
        private readonly configService: ConfigService,
        private readonly alertService: AlertService,
    ) {
        this.docker = new Docker({
            socketPath: this.configService.getOrThrow('DOCKER_SOCKET_PATH'),
        });
    }

    async onModuleInit() {
        await this.startMonitoring();
    }

    private async startMonitoring() {
        this.docker.getEvents(
            {
                filters: {
                    event: ['health_status'],
                },
            },
            (error, stream) => {
                if (error || !stream) {
                    console.error(error);
                    return;
                }

                stream.on('data', (chunk) => {
                    const event = JSON.parse(chunk.toString());
                    this.handleHealthEvent(event);
                });
            },
        );
    }
    private async handleHealthEvent(event: DockerEvent) {
        const container = event.Actor;
        const containerName = container.Attributes.name;
        const status = event.status.replace('health_status: ', '');

        console.log(
            `${containerName} ${status.replace('health_status: ', '')}`,
        );
        if (status == 'unhealthy') {
            await this.alertService.sendAlert(
                new UnhealthyContainerAlert({
                    containerName,
                    logs: await this.getContainerLogs(container.ID),
                }),
            );
        }
    }

    async getContainerLogs(containerId: string): Promise<string> {
        const container = this.docker.getContainer(containerId);

        const logs = cleanDockerLogs(
            await container.logs({
                stderr: true,
                stdout: true,
            }),
        );

        return logs;
    }
}
