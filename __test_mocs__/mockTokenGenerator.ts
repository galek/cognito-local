import { TokenGenerator } from "../src/services/tokenGenerator";

export const newMockTokenGenerator = (): jest.Mocked<TokenGenerator> => ({
  generate: jest.fn(),
});
