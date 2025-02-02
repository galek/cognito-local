import {newMockMessageDelivery} from "../../../__test_mocs__/mockMessageDelivery";
import {newMockTriggers} from "../../../__test_mocs__/mockTriggers";
import {TestContext} from "../../../__test_mocs__/testContext";
import * as TDB from "../../../__test_mocs__/testDataBuilder";
import {TriggersInterface} from "../triggers";
import { MessageDeliveryInterface } from "../../interfaces/services/messageDelivery.interface";
import { MessagesService } from "../../interfaces/services/messages.interface";

describe("messages service", () => {
    let mockTriggers: jest.Mocked<TriggersInterface>;
    let mockMessageDelivery: jest.Mocked<MessageDeliveryInterface>;

    const user = TDB.user();
    const deliveryDetails = {
        AttributeName: "email",
        DeliveryMedium: "EMAIL",
        Destination: "example@example.com",
    } as const;

    beforeEach(() => {
        mockTriggers = newMockTriggers();
        mockMessageDelivery = newMockMessageDelivery();
    });

    describe.each([
        "AdminCreateUser",
        "Authentication",
        "ForgotPassword",
        "ResendCode",
        "SignUp",
        "UpdateUserAttribute",
        "VerifyUserAttribute",
    ] as const)("%s", (source) => {
        describe("CustomMessage lambda is configured", () => {
            describe("lambda returns a custom message", () => {
                it("delivers the customised message", async () => {
                    mockTriggers.enabled.mockImplementation((name) => {
                        return name === "CustomMessage";
                    });
                    mockTriggers.customMessage.mockResolvedValue({
                        smsMessage: "sms",
                        emailSubject: "email subject",
                        emailMessage: "email",
                    });

                    const messages = new MessagesService(
                        mockTriggers,
                        mockMessageDelivery
                    );
                    await messages.deliver(
                        TestContext,
                        source,
                        "clientId",
                        "userPoolId",
                        user,
                        "123456",
                        {
                            client: "metadata",
                        },
                        deliveryDetails
                    );

                    expect(mockTriggers.customMessage).toHaveBeenCalledWith(TestContext, {
                        clientId: "clientId",
                        clientMetadata: {
                            client: "metadata",
                        },
                        code: "123456",
                        source: `CustomMessage_${source}`,
                        userAttributes: user.Attributes,
                        userPoolId: "userPoolId",
                        username: user.Username,
                    });

                    expect(mockMessageDelivery.deliver).toHaveBeenCalledWith(
                        TestContext,
                        user,
                        deliveryDetails,
                        {
                            __code: "123456",
                            emailMessage: "email",
                            emailSubject: "email subject",
                            smsMessage: "sms",
                        }
                    );
                });
            });

            describe("lambda does not return a custom message", () => {
                it("delivers just the code", async () => {
                    mockTriggers.enabled.mockImplementation((name) => {
                        return name === "CustomMessage";
                    });
                    mockTriggers.customMessage.mockResolvedValue(null);

                    const messages = new MessagesService(
                        mockTriggers,
                        mockMessageDelivery
                    );
                    await messages.deliver(
                        TestContext,
                        source,
                        "clientId",
                        "userPoolId",
                        user,
                        "123456",
                        {
                            client: "metadata",
                        },
                        deliveryDetails
                    );

                    expect(mockTriggers.customMessage).toHaveBeenCalledWith(TestContext, {
                        clientId: "clientId",
                        clientMetadata: {
                            client: "metadata",
                        },
                        code: "123456",
                        source: `CustomMessage_${source}`,
                        userAttributes: user.Attributes,
                        userPoolId: "userPoolId",
                        username: user.Username,
                    });

                    expect(mockMessageDelivery.deliver).toHaveBeenCalledWith(
                        TestContext,
                        user,
                        deliveryDetails,
                        {
                            __code: "123456",
                        }
                    );
                });
            });
        });

        describe("CustomMessage lambda is not configured", () => {
            it("delivers just the code", async () => {
                mockTriggers.enabled.mockReturnValue(false);

                const messages = new MessagesService(mockTriggers, mockMessageDelivery);
                await messages.deliver(
                    TestContext,
                    source,
                    "clientId",
                    "userPoolId",
                    user,
                    "123456",
                    {
                        client: "metadata",
                    },
                    deliveryDetails
                );

                expect(mockTriggers.customMessage).not.toHaveBeenCalled();
                expect(mockMessageDelivery.deliver).toHaveBeenCalledWith(
                    TestContext,
                    user,
                    deliveryDetails,
                    {
                        __code: "123456",
                    }
                );
            });
        });
    });
});
