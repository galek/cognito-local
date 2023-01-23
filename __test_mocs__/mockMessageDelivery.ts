import { MessageDeliveryInterface } from "../src/interfaces/services/messageDelivery.interface";

export const newMockMessageDelivery = (): jest.Mocked<MessageDeliveryInterface> => ({
  deliver: jest.fn(),
});
