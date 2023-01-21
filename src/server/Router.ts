import {ServicesInterface} from "../services";
import {UnsupportedError} from "../errors";
import {isSupportedTarget} from "../targets/Target";
import {Targets} from "../targets/targets";
import {ContextInterface} from "../interfaces/services/context.interface";

export type Route = (ctx: ContextInterface, req: any) => Promise<any>;
export type Router = (target: string) => Route;

export const Router =
    (services: ServicesInterface): Router =>
        (target: string) => {
            if (!isSupportedTarget(target)) {
                return () =>
                    Promise.reject(
                        new UnsupportedError(`Unsupported x-amz-target header "${target}"`)
                    );
            }

            const t = Targets[target](services);

            return async (ctx, req) => {
                const targetLogger = ctx.logger.child({
                    target,
                });

                targetLogger.debug("start");
                const res = await t(
                    {
                        ...ctx,
                        logger: targetLogger,
                    },
                    req
                );
                targetLogger.debug("end");
                return res;
            };
        };
