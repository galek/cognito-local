import { newMockCognitoService } from "../../../__test_mocs__/mockCognitoService";
import { newMockUserPoolService } from "../../../__test_mocs__/mockUserPoolService";
import { TestContext } from "../../../__test_mocs__/testContext";
import * as TDB from "../../../__test_mocs__/testDataBuilder";
import { UserNotFoundError } from "../../errors";
import { UserPoolService } from "../../services";
import { AdminGetUser, AdminGetUserTarget } from "../adminGetUser";

describe("AdminGetUser target", () => {
  let adminGetUser: AdminGetUserTarget;
  let mockUserPoolService: jest.Mocked<UserPoolService>;

  beforeEach(() => {
    mockUserPoolService = newMockUserPoolService();
    adminGetUser = AdminGetUser({
      cognito: newMockCognitoService(mockUserPoolService),
    });
  });

  it("gets the user", async () => {
    const existingUser = TDB.user();

    mockUserPoolService.getUserByUsername.mockResolvedValue(existingUser);

    const result = await adminGetUser(TestContext, {
      Username: existingUser.Username,
      UserPoolId: "test",
    });

    expect(result).toEqual({
      Enabled: existingUser.Enabled,
      UserAttributes: existingUser.Attributes,
      UserCreateDate: new Date(existingUser.UserCreateDate),
      UserLastModifiedDate: new Date(existingUser.UserLastModifiedDate),
      Username: existingUser.Username,
      UserStatus: existingUser.UserStatus,
    });
  });

  it("handles trying to get an invalid user", async () => {
    const existingUser = TDB.user();

    mockUserPoolService.getUserByUsername.mockResolvedValue(null);

    await expect(
      adminGetUser(TestContext, {
        Username: existingUser.Username,
        UserPoolId: "test",
      })
    ).rejects.toEqual(new UserNotFoundError("User does not exist"));
  });
});
