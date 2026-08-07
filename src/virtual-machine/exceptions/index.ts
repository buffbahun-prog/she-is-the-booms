export enum HardwareExceptionType {
    MemoryFault,
    AlignmentFault,
}

export class HardwareExpection extends Error {
    public readonly type: HardwareExceptionType;
    public readonly address?: number;

    constructor(
        type: HardwareExceptionType,
        message: string,
        address?: number,
    ) {
        super(message);
        this.name = "HardwareExpection";
        this.type = type;
        this.address = address;
    }
}