import { MessagesInterface } from "../src/services";

export const newMockMessages = (): jest.Mocked<MessagesInterface> => ({
  deliver: jest.fn(),
});
