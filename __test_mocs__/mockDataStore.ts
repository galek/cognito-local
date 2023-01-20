import { DataStoreInterface } from "../src/services/dataStore/dataStoreInterface";
import { DataStoreFactoryInterface } from "../src/services/dataStore/factory";

export const newMockDataStore = (): jest.Mocked<DataStoreInterface> => ({
  delete: jest.fn(),
  get: jest.fn(),
  getRoot: jest.fn(),
  set: jest.fn(),
});

export const newMockDataStoreFactory = (
  dataStore: jest.Mocked<DataStoreInterface> = newMockDataStore()
): jest.Mocked<DataStoreFactoryInterface> => ({
  create: jest.fn().mockResolvedValue(dataStore),
});
