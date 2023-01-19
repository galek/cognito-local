import { newMockCognitoService } from "../../../__test_mocs__/mockCognitoService";
import { newMockUserPoolService } from "../../../__test_mocs__/mockUserPoolService";
import { TestContext } from "../../../__test_mocs__/testContext";
import * as TDB from "../../../__test_mocs__/testDataBuilder";
import { GroupNotFoundError } from "../../errors";
import { UserPoolService } from "../../services";
import { DeleteGroup, DeleteGroupTarget } from "../deleteGroup";

describe("DeleteGroup target", () => {
  let deleteGroup: DeleteGroupTarget;
  let mockUserPoolService: jest.Mocked<UserPoolService>;

  beforeEach(() => {
    mockUserPoolService = newMockUserPoolService();

    deleteGroup = DeleteGroup({
      cognito: newMockCognitoService(mockUserPoolService),
    });
  });

  it("deletes a group", async () => {
    const existingGroup = TDB.group();

    mockUserPoolService.getGroupByGroupName.mockResolvedValue(existingGroup);

    await deleteGroup(TestContext, {
      GroupName: existingGroup.GroupName,
      UserPoolId: "test",
    });

    expect(mockUserPoolService.deleteGroup).toHaveBeenCalledWith(
      TestContext,
      existingGroup
    );
  });

  it("throws if the group doesn't exist", async () => {
    mockUserPoolService.getGroupByGroupName.mockResolvedValue(null);

    await expect(
      deleteGroup(TestContext, {
        GroupName: "group",
        UserPoolId: "test",
      })
    ).rejects.toEqual(new GroupNotFoundError());
  });
});
