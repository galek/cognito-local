import { Lambda } from "../src/services";

export const newMockLambda = (): jest.Mocked<Lambda> => ({
  enabled: jest.fn(),
  invoke: jest.fn(),
});
