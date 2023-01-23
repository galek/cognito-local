import { TokenGeneratorInterface } from "../src/interfaces/services/tokenGenerator.interface";

export const newMockTokenGenerator = (): jest.Mocked<TokenGeneratorInterface> => ({
  generate: jest.fn(),
});
