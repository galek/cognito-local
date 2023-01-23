import { ClockFake } from "../../../__test_mocs__/clockFake";
import { newMockCognitoService } from "../../../__test_mocs__/mockCognitoService";
import { newMockUserPoolService } from "../../../__test_mocs__/mockUserPoolService";
import { TestContext } from "../../../__test_mocs__/testContext";
import { NotAuthorizedError } from "../../errors";
import { UserPoolServiceInterface } from "../../services";
import {
  AdminDeleteUserAttributes,
  AdminDeleteUserAttributesTarget,
} from "../adminDeleteUserAttributes";
import * as TDB from "../../../__test_mocs__/testDataBuilder";
import { attribute } from "../../interfaces/services/userPoolService.interface";

describe("AdminDeleteUserAttributes target", () => {
  let adminDeleteUserAttributes: AdminDeleteUserAttributesTarget;
  let mockUserPoolService: jest.Mocked<UserPoolServiceInterface>;
  let clock: ClockFake;

  beforeEach(() => {
    mockUserPoolService = newMockUserPoolService();
    clock = new ClockFake(new Date());
    adminDeleteUserAttributes = AdminDeleteUserAttributes({
      clock,
      cognito: newMockCognitoService(mockUserPoolService),
    });
  });

  it("throws if the user doesn't exist", async () => {
    await expect(
      adminDeleteUserAttributes(TestContext, {
        UserPoolId: "test",
        Username: "abc",
        UserAttributeNames: ["custom:example"],
      })
    ).rejects.toEqual(new NotAuthorizedError());
  });

  it("saves the updated attributes on the user", async () => {
    const user = TDB.user({
      Attributes: [
        attribute("email", "example@example.com"),
        attribute("custom:example", "1"),
      ],
    });

    mockUserPoolService.getUserByUsername.mockResolvedValue(user);

    await adminDeleteUserAttributes(TestContext, {
      UserPoolId: "test",
      Username: "abc",
      UserAttributeNames: ["custom:example"],
    });

    expect(mockUserPoolService.saveUser).toHaveBeenCalledWith(TestContext, {
      ...user,
      Attributes: [attribute("email", "example@example.com")],
      UserLastModifiedDate: clock.get(),
    });
  });
});
