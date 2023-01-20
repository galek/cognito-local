import { ClockFake } from "../../../__test_mocs__/clockFake";
import { newMockCognitoService } from "../../../__test_mocs__/mockCognitoService";
import { newMockUserPoolService } from "../../../__test_mocs__/mockUserPoolService";
import { TestContext } from "../../../__test_mocs__/testContext";
import { UserPoolServiceInterface } from "../../services";
import {
  CreateUserPoolClient,
  CreateUserPoolClientTarget,
} from "../createUserPoolClient";

const originalDate = new Date();

describe("CreateUserPoolClient target", () => {
  let createUserPoolClient: CreateUserPoolClientTarget;
  let mockUserPoolService: jest.Mocked<UserPoolServiceInterface>;

  beforeEach(() => {
    mockUserPoolService = newMockUserPoolService();
    createUserPoolClient = CreateUserPoolClient({
      clock: new ClockFake(originalDate),
      cognito: newMockCognitoService(mockUserPoolService),
    });
  });

  it("creates a new app client", async () => {
    const result = await createUserPoolClient(TestContext, {
      ClientName: "clientName",
      UserPoolId: "userPoolId",
    });

    expect(mockUserPoolService.saveAppClient).toHaveBeenCalledWith(
      TestContext,
      {
        ClientId: expect.any(String),
        ClientName: "clientName",
        CreationDate: originalDate,
        LastModifiedDate: originalDate,
        UserPoolId: "userPoolId",
        TokenValidityUnits: {
          AccessToken: "hours",
          IdToken: "minutes",
          RefreshToken: "days",
        },
      }
    );

    expect(result).toEqual({
      UserPoolClient: {
        ClientId: expect.any(String),
        ClientName: "clientName",
        CreationDate: originalDate,
        LastModifiedDate: originalDate,
        UserPoolId: "userPoolId",
        TokenValidityUnits: {
          AccessToken: "hours",
          IdToken: "minutes",
          RefreshToken: "days",
        },
      },
    });
  });
});
