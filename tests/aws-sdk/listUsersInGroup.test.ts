import { ClockFake } from "../../__test_mocs__/clockFake";
import { withCognitoSdk } from "./setup";

const originalDate = new Date();
const roundedDate = new Date(originalDate.getTime());
roundedDate.setMilliseconds(0);

const clock = new ClockFake(originalDate);

describe(
  "CognitoIdentityServiceProvider.listUsersInGroup",
  withCognitoSdk(
    (Cognito) => {
      it("lists users in a group", async () => {
        const client = Cognito();

        await client
          .createGroup({
            GroupName: "group-1",
            UserPoolId: "test",
          })
          .promise();

        const createUserResponse = await client
          .adminCreateUser({
            DesiredDeliveryMediums: ["EMAIL"],
            TemporaryPassword: "def",
            UserAttributes: [{ Name: "email", Value: "example+1@example.com" }],
            Username: "user-1",
            UserPoolId: "test",
          })
          .promise();

        await client
          .adminAddUserToGroup({
            Username: "user-1",
            GroupName: "group-1",
            UserPoolId: "test",
          })
          .promise();

        const result = await client
          .listUsersInGroup({
            UserPoolId: "test",
            GroupName: "group-1",
          })
          .promise();

        expect(result.Users).toEqual([createUserResponse.User]);
      });

      it("lists no users in an empty group", async () => {
        const client = Cognito();

        await client
          .createGroup({
            GroupName: "group-2",
            UserPoolId: "test",
          })
          .promise();

        const result = await client
          .listUsersInGroup({
            UserPoolId: "test",
            GroupName: "group-2",
          })
          .promise();

        expect(result.Users).toHaveLength(0);
      });
    },
    {
      clock,
    }
  )
);
