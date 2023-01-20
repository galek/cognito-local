import { MessageDeliveryInterface } from "../src/services/messageDelivery/messageDeliveryInterface";

export const newMockMessageDelivery = (): jest.Mocked<MessageDeliveryInterface> => ({
  deliver: jest.fn(),
});
