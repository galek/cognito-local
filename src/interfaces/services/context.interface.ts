import {LogService} from "../../services/LogService";

export interface ContextInterface {
    readonly logger: LogService;
}
