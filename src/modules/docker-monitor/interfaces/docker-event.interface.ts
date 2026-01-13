export interface DockerEvent {
    status:
        | 'health_status: healthy'
        | 'health_status: unhealthy'
        | 'die'
        | 'start'
        | 'stop';
    id: string;
    from: string;
    Type: 'container' | 'network' | 'volume' | 'image';
    Action: string;
    Actor: {
        ID: string;
        Attributes: {
            name: string;
            image: string;
            [key: string]: string;
        };
    };
    scope: 'local' | 'swarm';
    time: number;
    timeNano: number;
}
