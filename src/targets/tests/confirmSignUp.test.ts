import { ClockFake } from "../../../__test_mocs__/clockFake";
import { newMockCognitoService } from "../../../__test_mocs__/mockCognitoService";
import { newMockTriggers } from "../../../__test_mocs__/mockTriggers";
import { newMockUserPoolService } from "../../../__test_mocs__/mockUserPoolService";
import { TestContext } from "../../../__test_mocs__/testContext";
import * as TDB from "../../../__test_mocs__/testDataBuilder";
import { CodeMismatchError, NotAuthorizedError } from "../../errors";
import { TriggersInterface, UserPoolServiceInterface } from "../../services";
import { ConfirmSignUp, ConfirmSignUpTarget } from "../confirmSignUp";
import { attribute, attributesAppend } from "../../interfaces/services/userPoolService.interface";

const originalDate = new Date();

describe("ConfirmSignUp target", () => {
  let confirmSignUp: ConfirmSignUpTarget;
  let mockUserPoolService: jest.Mocked<UserPoolServiceInterface>;
  let mockTriggers: jest.Mocked<TriggersInterface>;
  let clock: ClockFake;

  beforeEach(() => {
    clock = new ClockFake(originalDate);

    mockUserPoolService = newMockUserPoolService();
    mockTriggers = newMockTriggers();
    confirmSignUp = ConfirmSignUp({
      cognito: newMockCognitoService(mockUserPoolService),
      clock,
      triggers: mockTriggers,
    });
  });

  it("throws if user doesn't exist", async () => {
    mockUserPoolService.getUserByUsername.mockResolvedValue(null);

    await expect(
      confirmSignUp(TestContext, {
        ClientId: "clientId",
        Username: "janice",
        ConfirmationCode: "123456",
        ForceAliasCreation: false,
      })
    ).rejects.toBeInstanceOf(NotAuthorizedError);
  });

  it("throws if confirmation code doesn't match stored value", async () => {
    const user = TDB.user({
      ConfirmationCode: "456789",
      UserStatus: "UNCONFIRMED",
    });

    mockUserPoolService.getUserByUsername.mockResolvedValue(user);

    await expect(
      confirmSignUp(TestContext, {
        ClientId: "clientId",
        Username: user.Username,
        ConfirmationCode: "123456",
      })
    ).rejects.toBeInstanceOf(CodeMismatchError);
  });

  describe("when code matches", () => {
    it("updates the user's confirmed status", async () => {
      const user = TDB.user({
        ConfirmationCode: "456789",
        UserStatus: "UNCONFIRMED",
      });

      mockUserPoolService.getUserByUsername.mockResolvedValue(user);

      // advance the time so we can see the last modified timestamp change
      const newNow = clock.advanceBy(5000);

      await confirmSignUp(TestContext, {
        ClientId: "clientId",
        Username: user.Username,
        ConfirmationCode: "456789",
      });

      expect(mockUserPoolService.saveUser).toHaveBeenCalledWith(TestContext, {
        ...user,
        ConfirmationCode: undefined,
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

        await confirmSignUp(TestContext, {
          ClientId: "clientId",
          ClientMetadata: {
            client: "metadata",
          },
          Username: "janice",
          ConfirmationCode: "456789",
          ForceAliasCreation: false,
        });

        expect(mockTriggers.postConfirmation).toHaveBeenCalledWith(
          TestContext,
          {
            clientId: "clientId",
            clientMetadata: {
              client: "metadata",
            },
            source: "PostConfirmation_ConfirmSignUp",
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

        await confirmSignUp(TestContext, {
          ClientId: "clientId",
          Username: user.Username,
          ConfirmationCode: "456789",
        });

        expect(mockTriggers.postConfirmation).not.toHaveBeenCalled();
      });
    });
  });
});
