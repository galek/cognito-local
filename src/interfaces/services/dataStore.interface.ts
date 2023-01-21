import {ContextInterface} from "./context.interface";

export interface DataStoreInterface {
    delete(ctx: ContextInterface, key: string | string[]): Promise<void>;

    get<T>(ctx: ContextInterface, key: string | string[]): Promise<T | null>;

    get<T>(ctx: ContextInterface, key: string | string[], defaultValue: T): Promise<T>;

    getRoot<T>(ctx: ContextInterface): Promise<T | null>;

    set<T>(ctx: ContextInterface, key: string | string[], value: T): Promise<void>;
}
