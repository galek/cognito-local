import {ContextInterface} from "../context.interface";
import {DataStoreInterface} from "./dataStore.interface";

export interface DataStoreFactoryInterface {
    create(ctx: ContextInterface, id: string, defaults: object): Promise<DataStoreInterface>;
}
