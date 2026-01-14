import { Injectable, OnModuleInit } from '@nestjs/common';
import Docker from 'dockerode';
import { ConfigService } from '@nestjs/config';
import { DockerEvent } from './interfaces/docker-event.interface';
import { AlertService } from '../alert/alert.service';
import { UnhealthyContainerAlert } from '../alert/definitions/alerts/unhealthy-container.alert';
import { cleanDockerLogs } from './utils/clean-docker-logs.util';
import { UnknownErrorAlert } from '../alert/definitions/alerts/unknown-error.alert';
import { DEV_CONTAINERS_PREFIX } from './constants/dev-containers-prefix';
import { IContainersStatus } from './interfaces/system-status.interface';
import { ContainerIssue } from './enums/container-issue.enum';
import { SystemService } from '../system/system.service';

@Injectable()
export class DockerMonitorService implements OnModuleInit {
    private readonly docker: Docker;
    private readonly alertCooldowns = new Map<string, number>();
    private readonly ALERT_COOLDOWN_MS = 10 * 60 * 1000;
    private lastEventTime: number = Math.floor(Date.now() / 1000);
    constructor(
        private readonly configService: ConfigService,
        private readonly alertService: AlertService,
        private readonly systemService: SystemService,
    ) {
        this.docker = new Docker({
            socketPath: this.configService.getOrThrow('DOCKER_SOCKET_PATH'),
        });
    }

    async onModuleInit() {
        await this.startMonitoring();

        await this.checkExistingContainers();
    }

    async getContainersStatus(): Promise<IContainersStatus> {
        const containers = await this.docker.listContainers();

        const prodContainers = containers.filter(
            (c) =>
                !c.Names[0].replace('/', '').startsWith(DEV_CONTAINERS_PREFIX),
        );

        const total = prodContainers.length;
        const running = prodContainers.filter(
            (c) => c.State === 'running',
        ).length;
        const unhealthy = prodContainers.filter((c) =>
            c.Status.includes('unhealthy'),
        ).length;

        return {
            total,
            running,
            unhealthy,
        };
    }

    async getContainerLogs(containerId: string): Promise<string> {
        try {
            const container = this.docker.getContainer(containerId);

            const logs = cleanDockerLogs(
                await container.logs({
                    stderr: true,
                    stdout: true,
                    tail: 500,
                }),
            );

            return logs;
        } catch (e: unknown) {
            return `Could not fetch logs: 
            ${JSON.stringify(e, null, 2)}`;
        }
    }

    private async startMonitoring() {
        this.docker.getEvents(
            {
                since: this.lastEventTime,
                filters: {
                    event: ['health_status', 'die'],
                    type: ['container'],
                },
            },
            (error, stream) => {
                if (error || !stream) {
                    this.alertService.sendAlert(
                        new UnknownErrorAlert({
                            error: error
                                ? JSON.stringify(error, null, 2)
                                : 'Empty variable stream',
                        }),
                    );
                    return;
                }

                stream.on('data', (chunk) => {
                    const event = JSON.parse(chunk.toString());
                    this.handleHealthEvent(event);
                });

                stream.on('end', () => {
                    console.warn(
                        'Docker event stream ended. Attempting to reconnect...',
                    );
                    this.handleReconnectConnection();
                });

                stream.on('error', (err) => {
                    console.error('Docker event stream error:', err);
                    this.handleReconnectConnection(err);
                });
            },
        );
    }

    async handleReconnectConnection(error?: unknown) {
        await this.alertService.sendAlert(
            new UnknownErrorAlert({
                error:
                    'Docker stream is empty' + error
                        ? `${JSON.stringify(error, null, 2)}`
                        : '',
            }),
        );
    }

    private async handleHealthEvent(event: DockerEvent) {
        const container = event.Actor;
        const containerName = container.Attributes.name;
        const status = event.status.replace('health_status: ', '');
        const eventName = event.Action;
        console.log(
            `${containerName} ${status.replace('health_status: ', '')}`,
        );

        if (containerName.startsWith(DEV_CONTAINERS_PREFIX)) {
            return;
        }
        if (eventName == 'die') {
            const exitCode = event.Actor.Attributes.exitCode;

            if (exitCode == '0') {
                return;
            }

            await this.processIssuedContainer({
                id: container.ID,
                name: containerName,
                issue: ContainerIssue.Dead,
            });
        }
        if (status === 'healthy') {
            this.alertCooldowns.delete(container.ID);
            return;
        }
        if (status == 'unhealthy') {
            await this.processIssuedContainer({
                id: container.ID,
                name: containerName,
                issue: ContainerIssue.Unhealthy,
            });
        }
    }

    private async checkExistingContainers() {
        try {
            const containers = await this.docker.listContainers();

            for (const containerInfo of containers) {
                const containerName = containerInfo.Names[0].replace('/', '');
                if (
                    containerInfo.Status.includes('unhealthy') &&
                    !containerName.startsWith(DEV_CONTAINERS_PREFIX)
                ) {
                    await this.processIssuedContainer({
                        id: containerInfo.Id,
                        name: containerName,
                        issue: ContainerIssue.Unhealthy,
                    });
                }
            }
        } catch (e: unknown) {
            await this.alertService.sendAlert(
                new UnknownErrorAlert({
                    error: `Failed to check existing containers 
                    ${JSON.stringify(e, null, 2)}`,
                }),
            );
        }
    }

    private async processIssuedContainer(container: {
        id: string;
        name: string;
        issue: ContainerIssue;
    }) {
        const now = Date.now();
        const lastAlertTime = this.alertCooldowns.get(container.id);

        if (lastAlertTime && now - lastAlertTime < this.ALERT_COOLDOWN_MS) {
            return;
        }

        this.alertCooldowns.set(container.id, now);

        const ramStatus = await this.systemService.getRamStatus();
        const ssdStatus = await this.systemService.getSSDStatus();

        await this.alertService.sendAlert(
            new UnhealthyContainerAlert({
                containerName: container.name,
                logs: await this.getContainerLogs(container.id),
                issue: container.issue,
                ramStatus,
                ssdStatus,
            }),
        );
    }
}
