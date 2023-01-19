import { Messages } from "../src/services";

export const newMockMessages = (): jest.Mocked<Messages> => ({
  deliver: jest.fn(),
});
