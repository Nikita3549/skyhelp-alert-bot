export function cleanDockerLogs(buffer: Buffer): string {
    let offset = 0;
    let output = '';

    while (offset < buffer.length) {
        const size = buffer.readUInt32BE(offset + 4);
        offset += 8;

        output += buffer.toString('utf8', offset, offset + size);
        offset += size;
    }

    return output;
}
