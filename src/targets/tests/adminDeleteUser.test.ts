import { newMockCognitoService } from "../../../__test_mocs__/mockCognitoService";
import { newMockUserPoolService } from "../../../__test_mocs__/mockUserPoolService";
import { TestContext } from "../../../__test_mocs__/testContext";
import * as TDB from "../../../__test_mocs__/testDataBuilder";
import { UserNotFoundError } from "../../errors";
import { UserPoolServiceInterface } from "../../services";
import { AdminDeleteUser, AdminDeleteUserTarget } from "../adminDeleteUser";

describe("AdminDeleteUser target", () => {
  let adminDeleteUser: AdminDeleteUserTarget;
  let mockUserPoolService: jest.Mocked<UserPoolServiceInterface>;

  beforeEach(() => {
    mockUserPoolService = newMockUserPoolService();
    adminDeleteUser = AdminDeleteUser({
      cognito: newMockCognitoService(mockUserPoolService),
    });
  });

  it("deletes the user", async () => {
    const existingUser = TDB.user();

    mockUserPoolService.getUserByUsername.mockResolvedValue(existingUser);

    await adminDeleteUser(TestContext, {
      Username: existingUser.Username,
      UserPoolId: "test",
    });

    expect(mockUserPoolService.deleteUser).toHaveBeenCalledWith(
      TestContext,
      existingUser
    );
  });

  it("handles trying to delete an invalid user", async () => {
    const existingUser = TDB.user();

    mockUserPoolService.getUserByUsername.mockResolvedValue(null);

    await expect(
      adminDeleteUser(TestContext, {
        Username: existingUser.Username,
        UserPoolId: "test",
      })
    ).rejects.toEqual(new UserNotFoundError("User does not exist"));
  });
});
