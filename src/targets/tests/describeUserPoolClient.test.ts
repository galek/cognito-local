import { newMockCognitoService } from "../../../__test_mocs__/mockCognitoService";
import { newMockUserPoolService } from "../../../__test_mocs__/mockUserPoolService";
import { TestContext } from "../../../__test_mocs__/testContext";
import { ResourceNotFoundError } from "../../errors";
import { CognitoService } from "../../services";
import { AppClientInterface } from "../../services/appClientInterface";
import {
  DescribeUserPoolClient,
  DescribeUserPoolClientTarget,
} from "../describeUserPoolClient";

describe("DescribeUserPoolClient target", () => {
  let describeUserPoolClient: DescribeUserPoolClientTarget;
  let mockCognitoService: jest.Mocked<CognitoService>;

  beforeEach(() => {
    mockCognitoService = newMockCognitoService(newMockUserPoolService());
    describeUserPoolClient = DescribeUserPoolClient({
      cognito: mockCognitoService,
    });
  });

  it("returns an existing app client", async () => {
    const existingAppClient: AppClientInterface = {
      RefreshTokenValidity: 30,
      AllowedOAuthFlowsUserPoolClient: false,
      LastModifiedDate: new Date(),
      CreationDate: new Date(),
      UserPoolId: "userPoolId",
      ClientId: "abc",
      ClientName: "clientName",
    };
    mockCognitoService.getAppClient.mockResolvedValue(existingAppClient);

    const result = await describeUserPoolClient(TestContext, {
      ClientId: "abc",
      UserPoolId: "userPoolId",
    });

    expect(result).toEqual({
      UserPoolClient: {
        ...existingAppClient,
        CreationDate: new Date(existingAppClient.CreationDate),
        LastModifiedDate: new Date(existingAppClient.LastModifiedDate),
      },
    });
  });

  it("throws resource not found for an invalid app client", async () => {
    mockCognitoService.getAppClient.mockResolvedValue(null);

    await expect(
      describeUserPoolClient(TestContext, {
        ClientId: "abc",
        UserPoolId: "userPoolId",
      })
    ).rejects.toEqual(new ResourceNotFoundError());
  });
});
