import { ClockFake } from "../../../__test_mocs__/clockFake";
import { newMockCognitoService } from "../../../__test_mocs__/mockCognitoService";
import { newMockTriggers } from "../../../__test_mocs__/mockTriggers";
import { newMockUserPoolService } from "../../../__test_mocs__/mockUserPoolService";
import { TestContext } from "../../../__test_mocs__/testContext";
import * as TDB from "../../../__test_mocs__/testDataBuilder";
import { NotAuthorizedError } from "../../errors";
import { TriggersInterface, UserPoolServiceInterface } from "../../services";
import { attribute, attributesAppend } from "../../services/userPoolServiceInterface";
import {
  AdminConfirmSignUp,
  AdminConfirmSignUpTarget,
} from "../adminConfirmSignUp";

const currentDate = new Date();

const clock = new ClockFake(currentDate);

describe("AdminConfirmSignUp target", () => {
  let adminConfirmSignUp: AdminConfirmSignUpTarget;
  let mockUserPoolService: jest.Mocked<UserPoolServiceInterface>;
  let mockTriggers: jest.Mocked<TriggersInterface>;

  beforeEach(() => {
    mockUserPoolService = newMockUserPoolService();
    mockTriggers = newMockTriggers();
    adminConfirmSignUp = AdminConfirmSignUp({
      clock,
      cognito: newMockCognitoService(mockUserPoolService),
      triggers: mockTriggers,
    });
  });

  it("throws if the user doesn't exist", async () => {
    mockUserPoolService.getUserByUsername.mockResolvedValue(null);

    await expect(
      adminConfirmSignUp(TestContext, {
        ClientMetadata: {
          client: "metadata",
        },
        Username: "invalid user",
        UserPoolId: "test",
      })
    ).rejects.toEqual(new NotAuthorizedError());
  });

  it("updates the user's status", async () => {
    const user = TDB.user();

    mockUserPoolService.getUserByUsername.mockResolvedValue(user);

    await adminConfirmSignUp(TestContext, {
      ClientMetadata: {
        client: "metadata",
      },
      Username: user.Username,
      UserPoolId: "test",
    });

    expect(mockUserPoolService.saveUser).toHaveBeenCalledWith(TestContext, {
      ...user,
      UserLastModifiedDate: currentDate,
      UserStatus: "CONFIRMED",
    });
  });

  describe("when PostConfirmation trigger is enabled", () => {
    it("invokes the trigger", async () => {
      mockTriggers.enabled.mockImplementation(
        (trigger) => trigger === "PostConfirmation"
      );

      const user = TDB.user();

      mockUserPoolService.getUserByUsername.mockResolvedValue(user);

      await adminConfirmSignUp(TestContext, {
        ClientMetadata: {
          client: "metadata",
        },
        Username: user.Username,
        UserPoolId: "test",
      });

      expect(mockTriggers.postConfirmation).toHaveBeenCalledWith(TestContext, {
        clientId: null,
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
      });
    });
  });

  describe("when PostConfirmation trigger is not enabled", () => {
    it("invokes the trigger", async () => {
      mockTriggers.enabled.mockReturnValue(false);

      const user = TDB.user();

      mockUserPoolService.getUserByUsername.mockResolvedValue(user);

      await adminConfirmSignUp(TestContext, {
        ClientMetadata: {
          client: "metadata",
        },
        Username: user.Username,
        UserPoolId: "test",
      });

      expect(mockTriggers.postConfirmation).not.toHaveBeenCalled();
    });
  });
});
