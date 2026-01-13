export abstract class BaseAlert {
    abstract getText(): string;

    getAttachment(): { source: Buffer; filename: string } | null {
        return null;
    }
}
