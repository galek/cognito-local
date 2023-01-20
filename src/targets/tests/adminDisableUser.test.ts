import { ClockFake } from "../../../__test_mocs__/clockFake";
import { newMockCognitoService } from "../../../__test_mocs__/mockCognitoService";
import { newMockUserPoolService } from "../../../__test_mocs__/mockUserPoolService";
import { TestContext } from "../../../__test_mocs__/testContext";
import * as TDB from "../../../__test_mocs__/testDataBuilder";
import { UserNotFoundError } from "../../errors";
import { UserPoolServiceInterface } from "../../services";
import { AdminDisableUser, AdminDisableUserTarget } from "../adminDisableUser";

const originalDate = new Date();

describe("AdminDisableUser target", () => {
  let adminDisableUser: AdminDisableUserTarget;
  let mockUserPoolService: jest.Mocked<UserPoolServiceInterface>;
  let clock: ClockFake;

  beforeEach(() => {
    mockUserPoolService = newMockUserPoolService();
    clock = new ClockFake(originalDate);

    adminDisableUser = AdminDisableUser({
      clock,
      cognito: newMockCognitoService(mockUserPoolService),
    });
  });

  it("enables the user", async () => {
    const existingUser = TDB.user();

    mockUserPoolService.getUserByUsername.mockResolvedValue(existingUser);

    const newDate = new Date();
    clock.advanceTo(newDate);

    await adminDisableUser(TestContext, {
      Username: existingUser.Username,
      UserPoolId: "test",
    });

    expect(mockUserPoolService.saveUser).toHaveBeenCalledWith(TestContext, {
      ...existingUser,
      UserLastModifiedDate: newDate,
      Enabled: false,
    });
  });

  it("throws if the user doesn't exist", async () => {
    await expect(
      adminDisableUser(TestContext, {
        Username: "user",
        UserPoolId: "test",
      })
    ).rejects.toEqual(new UserNotFoundError());
  });
});
