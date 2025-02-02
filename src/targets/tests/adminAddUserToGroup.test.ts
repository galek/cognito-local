import { ClockFake } from "../../../__test_mocs__/clockFake";
import { newMockCognitoService } from "../../../__test_mocs__/mockCognitoService";
import { newMockUserPoolService } from "../../../__test_mocs__/mockUserPoolService";
import { TestContext } from "../../../__test_mocs__/testContext";
import * as TDB from "../../../__test_mocs__/testDataBuilder";
import { GroupNotFoundError, UserNotFoundError } from "../../errors";
import { UserPoolServiceInterface } from "../../services";
import {
  AdminAddUserToGroup,
  AdminAddUserToGroupTarget,
} from "../adminAddUserToGroup";

const originalDate = new Date();

describe("AdminAddUserToGroup target", () => {
  let adminAddUserToGroup: AdminAddUserToGroupTarget;
  let mockUserPoolService: jest.Mocked<UserPoolServiceInterface>;
  let clock: ClockFake;

  beforeEach(() => {
    mockUserPoolService = newMockUserPoolService();
    clock = new ClockFake(originalDate);

    adminAddUserToGroup = AdminAddUserToGroup({
      cognito: newMockCognitoService(mockUserPoolService),
    });
  });

  it("adds the user to a group", async () => {
    const existingGroup = TDB.group();
    const existingUser = TDB.user();

    mockUserPoolService.getGroupByGroupName.mockResolvedValue(existingGroup);
    mockUserPoolService.getUserByUsername.mockResolvedValue(existingUser);

    const newDate = new Date();
    clock.advanceTo(newDate);

    await adminAddUserToGroup(TestContext, {
      GroupName: existingGroup.GroupName,
      Username: existingUser.Username,
      UserPoolId: "test",
    });

    expect(mockUserPoolService.addUserToGroup).toHaveBeenCalledWith(
      TestContext,
      existingGroup,
      existingUser
    );
  });

  it("throws if the group doesn't exist", async () => {
    const existingUser = TDB.user();

    mockUserPoolService.getGroupByGroupName.mockResolvedValue(null);
    mockUserPoolService.getUserByUsername.mockResolvedValue(existingUser);

    await expect(
      adminAddUserToGroup(TestContext, {
        GroupName: "group",
        Username: existingUser.Username,
        UserPoolId: "test",
      })
    ).rejects.toEqual(new GroupNotFoundError());
  });

  it("throws if the user doesn't exist", async () => {
    const existingGroup = TDB.group();

    mockUserPoolService.getGroupByGroupName.mockResolvedValue(existingGroup);
    mockUserPoolService.getUserByUsername.mockResolvedValue(null);

    await expect(
      adminAddUserToGroup(TestContext, {
        GroupName: existingGroup.GroupName,
        Username: "user",
        UserPoolId: "test",
      })
    ).rejects.toEqual(new UserNotFoundError());
  });
});
