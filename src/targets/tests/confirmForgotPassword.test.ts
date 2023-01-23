import { ClockFake } from "../../../__test_mocs__/clockFake";
import { newMockCognitoService } from "../../../__test_mocs__/mockCognitoService";
import { newMockTriggers } from "../../../__test_mocs__/mockTriggers";
import { newMockUserPoolService } from "../../../__test_mocs__/mockUserPoolService";
import { TestContext } from "../../../__test_mocs__/testContext";
import { CodeMismatchError, UserNotFoundError } from "../../errors";
import { TriggersInterface, UserPoolServiceInterface } from "../../services";
import {
  ConfirmForgotPassword,
  ConfirmForgotPasswordTarget,
} from "../confirmForgotPassword";
import * as TDB from "../../../__test_mocs__/testDataBuilder";
import { attribute, attributesAppend } from "../../interfaces/services/userPoolService.interface";

const currentDate = new Date();

describe("ConfirmForgotPassword target", () => {
  let confirmForgotPassword: ConfirmForgotPasswordTarget;
  let mockUserPoolService: jest.Mocked<UserPoolServiceInterface>;
  let mockTriggers: jest.Mocked<TriggersInterface>;

  let clock: ClockFake;

  beforeEach(() => {
    clock = new ClockFake(currentDate);

    mockUserPoolService = newMockUserPoolService();
    mockTriggers = newMockTriggers();
    confirmForgotPassword = ConfirmForgotPassword({
      clock,
      cognito: newMockCognitoService(mockUserPoolService),
      triggers: mockTriggers,
    });
  });

  it("throws if user doesn't exist", async () => {
    mockUserPoolService.getUserByUsername.mockResolvedValue(null);

    await expect(
      confirmForgotPassword(TestContext, {
        ClientId: "clientId",
        Username: "janice",
        ConfirmationCode: "123456",
        Password: "newPassword",
      })
    ).rejects.toBeInstanceOf(UserNotFoundError);
  });

  it("throws if confirmation code doesn't match stored value", async () => {
    const user = TDB.user({
      ConfirmationCode: "456789",
      UserStatus: "UNCONFIRMED",
    });

    mockUserPoolService.getUserByUsername.mockResolvedValue(user);

    await expect(
      confirmForgotPassword(TestContext, {
        ClientId: "clientId",
        Username: "janice",
        ConfirmationCode: "123456",
        Password: "newPassword",
      })
    ).rejects.toBeInstanceOf(CodeMismatchError);
  });

  describe("when code matches", () => {
    it("updates the user's password", async () => {
      const user = TDB.user({
        ConfirmationCode: "456789",
        UserStatus: "UNCONFIRMED",
      });

      mockUserPoolService.getUserByUsername.mockResolvedValue(user);

      // advance the time so we can see the last modified timestamp change
      const newNow = clock.advanceBy(5000);

      await confirmForgotPassword(TestContext, {
        ClientId: "clientId",
        Username: user.Username,
        ConfirmationCode: "456789",
        Password: "newPassword",
      });

      expect(mockUserPoolService.saveUser).toHaveBeenCalledWith(TestContext, {
        ...user,
        ConfirmationCode: undefined,
        Password: "newPassword",
        UserLastModifiedDate: newNow,
        UserStatus: "CONFIRMED",
      });
    });

    describe("when PostConfirmation trigger configured", () => {
      it("invokes the trigger", async () => {
        mockTriggers.enabled.mockReturnValue(true);

        const user = TDB.user({
          ConfirmationCode: "456789",
          UserStatus: "UNCONFIRMED",
        });

        mockUserPoolService.getUserByUsername.mockResolvedValue(user);

        await confirmForgotPassword(TestContext, {
          ClientId: "clientId",
          ClientMetadata: {
            client: "metadata",
          },
          Username: user.Username,
          ConfirmationCode: "456789",
          Password: "newPassword",
        });

        expect(mockTriggers.postConfirmation).toHaveBeenCalledWith(
          TestContext,
          {
            clientId: "clientId",
            clientMetadata: {
              client: "metadata",
            },
            source: "PostConfirmation_ConfirmForgotPassword",
            userAttributes: attributesAppend(
              user.Attributes,
              attribute("cognito:user_status", "CONFIRMED")
            ),
            userPoolId: "test",
            username: user.Username,
          }
        );
      });
    });

    describe("when PostConfirmation trigger not configured", () => {
      it("doesn't invoke the trigger", async () => {
        mockTriggers.enabled.mockReturnValue(false);

        const user = TDB.user({
          ConfirmationCode: "456789",
          UserStatus: "UNCONFIRMED",
        });

        mockUserPoolService.getUserByUsername.mockResolvedValue(user);

        await confirmForgotPassword(TestContext, {
          ClientId: "clientId",
          Username: user.Username,
          ConfirmationCode: "456789",
          Password: "newPassword",
        });

        expect(mockTriggers.postConfirmation).not.toHaveBeenCalled();
      });
    });
  });
});
