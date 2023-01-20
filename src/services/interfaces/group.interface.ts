export interface GroupInterface {
    /**
     * The name of the group.
     */
    GroupName: string;
    /**
     * A string containing the description of the group.
     */
    Description?: string;
    /**
     * The role ARN for the group.
     */
    RoleArn?: string;
    /**
     * A nonnegative integer value that specifies the precedence of this group relative to the other groups that a user can belong to in the user pool. If a user belongs to two or more groups, it is the group with the highest precedence whose role ARN will be used in the cognito:roles and cognito:preferred_role claims in the user's tokens. Groups with higher Precedence values take precedence over groups with lower Precedence values or with null Precedence values. Two groups can have the same Precedence value. If this happens, neither group takes precedence over the other. If two groups with the same Precedence have the same role ARN, that role is used in the cognito:preferred_role claim in tokens for users in each group. If the two groups have different role ARNs, the cognito:preferred_role claim is not set in users' tokens. The default Precedence value is null.
     */
    Precedence?: number;
    /**
     * The date the group was last modified.
     */
    LastModifiedDate: Date;
    /**
     * The date the group was created.
     */
    CreationDate: Date;

    /**
     * The group's membership, a list of Usernames
     */
    members?: readonly string[];
}
