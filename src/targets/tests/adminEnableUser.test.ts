import { ClockFake } from "../../../__test_mocs__/clockFake";
import { newMockCognitoService } from "../../../__test_mocs__/mockCognitoService";
import { newMockUserPoolService } from "../../../__test_mocs__/mockUserPoolService";
import { TestContext } from "../../../__test_mocs__/testContext";
import * as TDB from "../../../__test_mocs__/testDataBuilder";
import { UserNotFoundError } from "../../errors";
import { UserPoolService } from "../../services";
import { AdminEnableUser, AdminEnableUserTarget } from "../adminEnableUser";

const originalDate = new Date();

describe("AdminEnableUser target", () => {
  let adminEnableUser: AdminEnableUserTarget;
  let mockUserPoolService: jest.Mocked<UserPoolService>;
  let clock: ClockFake;

  beforeEach(() => {
    mockUserPoolService = newMockUserPoolService();
    clock = new ClockFake(originalDate);

    adminEnableUser = AdminEnableUser({
      clock,
      cognito: newMockCognitoService(mockUserPoolService),
    });
  });

  it("enables the user", async () => {
    const existingUser = TDB.user();

    mockUserPoolService.getUserByUsername.mockResolvedValue(existingUser);

    const newDate = new Date();
    clock.advanceTo(newDate);

    await adminEnableUser(TestContext, {
      Username: existingUser.Username,
      UserPoolId: "test",
    });

    expect(mockUserPoolService.saveUser).toHaveBeenCalledWith(TestContext, {
      ...existingUser,
      UserLastModifiedDate: newDate,
      Enabled: true,
    });
  });

  it("throws if the user doesn't exist", async () => {
    await expect(
      adminEnableUser(TestContext, {
        Username: "user",
        UserPoolId: "test",
      })
    ).rejects.toEqual(new UserNotFoundError());
  });
});
