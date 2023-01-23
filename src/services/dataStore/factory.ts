import {ContextInterface} from "../../interfaces/services/context.interface";
import {DataStoreInterface} from "../../interfaces/services/dataStore.interface";

export interface DataStoreFactoryInterface {
    create(ctx: ContextInterface, id: string, defaults: object): Promise<DataStoreInterface>;
}
