import {ContextInterface} from "../interfaces/services/context.interface";
import {Targets} from "./targets";

export type TargetName = keyof typeof Targets;

export type Target<Req extends {}, Res extends {}> = (
    ctx: ContextInterface,
    req: Req
) => Promise<Res>;

export const isSupportedTarget = (name: string): name is TargetName =>
    Object.keys(Targets).includes(name);
