import { TestContext } from "../../../../__test_mocs__/testContext";
import { UserInterface } from "../../../interfaces/services/userPoolService.interface";
import { MessageSenderInterface } from "../../../interfaces/services/messageSender.interface";
import { MessageDeliveryService } from "../../../interfaces/services/messageDelivery.interface";

describe("Message Delivery", () => {
  const user: UserInterface = {
    Username: "1",
    UserStatus: "CONFIRMED",
    Attributes: [],
    Password: "hunter2",
    Enabled: true,
    UserCreateDate: new Date(),
    UserLastModifiedDate: new Date(),
    RefreshTokens: [],
  };

  describe("when delivery method is EMAIL", () => {
    it("sends a code via email", async () => {
      const sender: jest.Mocked<MessageSenderInterface> = {
        sendEmail: jest.fn(),
        sendSms: jest.fn(),
      };
      const message = {
        emailSubject: "Subject",
        emailMessage: "Body",
      };
      const messageDelivery = new MessageDeliveryService(sender);

      await messageDelivery.deliver(
        TestContext,
        user,
        {
          Destination: "example@example.com",
          DeliveryMedium: "EMAIL",
          AttributeName: "email",
        },
        message
      );

      expect(sender.sendEmail).toHaveBeenCalledWith(
        TestContext,
        user,
        "example@example.com",
        message
      );
      expect(sender.sendSms).not.toHaveBeenCalled();
    });
  });

  describe("when delivery method is SMS", () => {
    it("sends a code via SMS", async () => {
      const sender: jest.Mocked<MessageSenderInterface> = {
        sendEmail: jest.fn(),
        sendSms: jest.fn(),
      };
      const message = {
        emailSubject: "Subject",
        emailMessage: "Body",
      };
      const messageDelivery = new MessageDeliveryService(sender);

      await messageDelivery.deliver(
        TestContext,
        user,
        {
          Destination: "0123445670",
          DeliveryMedium: "SMS",
          AttributeName: "phone_number",
        },
        message
      );

      expect(sender.sendSms).toHaveBeenCalledWith(
        TestContext,
        user,
        "0123445670",
        message
      );
      expect(sender.sendEmail).not.toHaveBeenCalled();
    });
  });
});
