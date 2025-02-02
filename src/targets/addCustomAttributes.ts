import {AddCustomAttributesRequest, AddCustomAttributesResponse,} from "aws-sdk/clients/cognitoidentityserviceprovider";
import {InvalidParameterError} from "../errors";
import {ServicesInterface} from "../services";
import {assertParameterLength} from "./utils/assertions";
import {Target} from "./Target";

export type AddCustomAttributesTarget = Target<AddCustomAttributesRequest,
    AddCustomAttributesResponse>;

type AddCustomAttributesServices = Pick<ServicesInterface, "clock" | "cognito">;

export const AddCustomAttributes =
    ({
    clock,
    cognito,
  }: AddCustomAttributesServices): AddCustomAttributesTarget =>
  async (ctx, req) => {
    assertParameterLength("CustomAttributes", 1, 25, req.CustomAttributes);

    const userPool = await cognito.getUserPool(ctx, req.UserPoolId);

    await userPool.updateOptions(ctx, {
      ...userPool.options,
      SchemaAttributes: [
        ...(userPool.options.SchemaAttributes ?? []),
        ...req.CustomAttributes.map(({ Name, ...attr }) => {
          const name = `custom:${Name ?? "null"}`;

          if (userPool.options.SchemaAttributes?.find((x) => x.Name === name)) {
            throw new InvalidParameterError(
              `${name}: Existing attribute already has name ${name}.`
            );
          }

          return {
            AttributeDataType: "String",
            DeveloperOnlyAttribute: false,
            Mutable: true,
            Required: false,
            StringAttributeConstraints: {},
            Name: name,
            ...attr,
          };
        }),
      ],
      LastModifiedDate: clock.get(),
    });

    return {};
  };
