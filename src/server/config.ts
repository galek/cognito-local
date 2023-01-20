import {ContextInterface} from "../services/context.interface";
import {DataStoreFactoryInterface} from "../services/dataStore/factory";
import mergeWith from "lodash.mergewith";
import {ConfigInterface} from "./interfaces/config.interface";

export const DefaultConfig: ConfigInterface = {
    LambdaClient: {
        credentials: {
            accessKeyId: "local", secretAccessKey: "local",
        }, region: "local",
    }, TriggerFunctions: {}, UserPoolDefaults: {
        UsernameAttributes: ["email"],
    }, TokenConfig: {
        // TODO: this needs to match the actual host/port we started the server on
        IssuerDomain: "http://localhost:9229",
    }, KMSConfig: {
        credentials: {
            accessKeyId: "local", secretAccessKey: "local",
        }, region: "local",
    },
};

export const loadConfig = async (ctx: ContextInterface, dataStoreFactory: DataStoreFactoryInterface): Promise<ConfigInterface> => {
    ctx.logger.debug("loadConfig");
    const dataStore = await dataStoreFactory.create(ctx, "config", {});

    const config = await dataStore.getRoot<ConfigInterface>(ctx);

    return mergeWith({}, DefaultConfig, config ?? {}, function customizer(objValue, srcValue) {
        if (Array.isArray(srcValue)) {
            return srcValue;
        }
    });
};
