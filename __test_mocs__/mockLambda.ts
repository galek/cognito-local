import { LambdaInterface } from "../src/services";

export const newMockLambda = (): jest.Mocked<LambdaInterface> => ({
  enabled: jest.fn(),
  invoke: jest.fn(),
});
