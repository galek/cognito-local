import { DataStore } from "../src/services/dataStore/dataStore";
import { DataStoreFactory } from "../src/services/dataStore/factory";

export const newMockDataStore = (): jest.Mocked<DataStore> => ({
  delete: jest.fn(),
  get: jest.fn(),
  getRoot: jest.fn(),
  set: jest.fn(),
});

export const newMockDataStoreFactory = (
  dataStore: jest.Mocked<DataStore> = newMockDataStore()
): jest.Mocked<DataStoreFactory> => ({
  create: jest.fn().mockResolvedValue(dataStore),
});
