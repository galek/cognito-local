import {ContextInterface} from "../../interfaces/services/context.interface";

export type Trigger<Params extends {}, Res extends {} | null | void> = (
    ctx: ContextInterface,
    params: Params
) => Promise<Res>;
