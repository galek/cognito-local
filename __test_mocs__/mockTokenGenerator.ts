import { TokenGeneratorInterface } from "../src/services/tokenGeneratorInterface";

export const newMockTokenGenerator = (): jest.Mocked<TokenGeneratorInterface> => ({
  generate: jest.fn(),
});
