import { MessageDelivery } from "../src/services/messageDelivery/messageDelivery";

export const newMockMessageDelivery = (): jest.Mocked<MessageDelivery> => ({
  deliver: jest.fn(),
});
