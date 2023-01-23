import { newMockLambda } from "../../../../__test_mocs__/mockLambda";
import { TestContext } from "../../../../__test_mocs__/testContext";
import { LambdaInterface } from "../../../interfaces/services/lambda.interface";
import { PostConfirmation, PostConfirmationTrigger } from "../postConfirmation";

describe("PostConfirmation trigger", () => {
  let mockLambda: jest.Mocked<LambdaInterface>;
  let postConfirmation: PostConfirmationTrigger;

  beforeEach(() => {
    mockLambda = newMockLambda();
    postConfirmation = PostConfirmation({
      lambda: mockLambda,
    });
  });

  describe.each([
    "PostConfirmation_ConfirmSignUp",
    "PostConfirmation_ConfirmForgotPassword",
  ])("%s", (source) => {
    describe("when lambda invoke fails", () => {
      it("quietly completes", async () => {
        mockLambda.invoke.mockRejectedValue(
          new Error("Something bad happened")
        );

        await postConfirmation(TestContext, {
          userPoolId: "userPoolId",
          clientId: "clientId",
          username: "username",
          userAttributes: [],
          source: source as any,
        });
      });
    });

    describe("when lambda invoke succeeds", () => {
      it("quietly completes", async () => {
        mockLambda.invoke.mockResolvedValue({});

        await postConfirmation(TestContext, {
          userPoolId: "userPoolId",
          clientId: "clientId",
          username: "example@example.com",
          userAttributes: [{ Name: "email", Value: "example@example.com" }],
          source: source as any,
        });

        expect(mockLambda.invoke).toHaveBeenCalledWith(
          TestContext,
          "PostConfirmation",
          {
            clientId: "clientId",
            triggerSource: source,
            userAttributes: { email: "example@example.com" },
            userPoolId: "userPoolId",
            username: "example@example.com",
          }
        );
      });
    });
  });
});
