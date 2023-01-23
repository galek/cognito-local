import {DataStoreInterface} from "../../interfaces/services/dataStore.interface";

export type DataStoreCache = {
    get(key: string): DataStoreInterface | null;
    set(key: string, value: DataStoreInterface): void;
};

export class InMemoryCache implements DataStoreCache {
    private readonly cache: Record<string, DataStoreInterface> = {};

    get(key: string): DataStoreInterface | null {
        return this.cache[key];
    }

    set(key: string, value: DataStoreInterface): void {
        this.cache[key] = value;
    }
}

export class NoOpCache implements DataStoreCache {
    get(): DataStoreInterface | null {
        return null;
    }

    set(): void {
    }
}
