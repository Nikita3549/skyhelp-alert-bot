import { DockerMonitorService } from '../docker-monitor/docker-monitor.service';
import { Command, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';

@Update()
export class ControlService {
    constructor(private readonly dockerMonitorService: DockerMonitorService) {}

    @Command('status')
    async handleStatusRequest(ctx: Context) {
        const containers =
            await this.dockerMonitorService.getContainersStatus();

        const message = [
            `📦 *Containers:* ${containers.running} / ${containers.total}`,
            `🟢 *Healthy:* ${containers.total - containers.unhealthy}`,
        ].join('\n');

        await ctx.replyWithMarkdownV2(message);
    }
}
