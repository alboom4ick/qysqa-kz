import {ErrorResponse} from "@/services/baseApi";

export class HttpException extends Error {
    status: number;
    message: string;
    timestamp: number;

    constructor(error: ErrorResponse) {
        super(error.message);
        this.status = error.status;
        this.message = error.message;
        this.timestamp = error.timestamp;
    }
}
