import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as s3 from 'aws-cdk-lib/aws-s3';


interface GithubOidcStackProps extends cdk.StackProps {
    appName: string;
    distribution: cloudfront.Distribution;
    websiteBucket: s3.Bucket;
    allowedRepositories: string[];
}

export class GithubOidcStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: GithubOidcStackProps) {
        super(scope, id, props);

        const githubDomain = 'token.actions.githubusercontent.com';
        const clientId = 'sts.amazonaws.com';

        /**
         * Creates an OpenIdConnectProvider for GitHub OIDC
         *  - appName: the name of the app
         *  - providerUrl: where github generates and stores its OIDC tokens
         *  - clientIds: the client IDs that are allowed to use the tokens, in this case, it's STS used for IAM authentication
         */
        const githubProvider = new iam.OpenIdConnectProvider(this, `${props.appName}GithubOidcProvider`, {
            url: `https://${githubDomain}`,
            clientIds: [clientId],
        });


        // CONDITIONS
        const allowedRepositories = props.allowedRepositories.map(repo => `repo:${repo}`);

        const conditions: iam.Conditions = {
            StringEquals: {
                [`${githubDomain}:aud`]: clientId,
            },
            StringLike: {
                [`${githubDomain}:sub`]: allowedRepositories,
            },
        };

        const githubActionsRole = new iam.Role(this, 'GitHubActionsRole', {
            roleName: `${props.appName}GitHubActionsRole`,
            assumedBy: new iam.WebIdentityPrincipal(
                githubProvider.openIdConnectProviderArn,
                conditions,
            ),
            inlinePolicies: {
                'GitHubActionsPolicy': new iam.PolicyDocument({
                    statements: [
                        new iam.PolicyStatement({
                            actions: ['s3:*'],
                            resources: [
                                props.websiteBucket.bucketArn,
                                `${props.websiteBucket.bucketArn}/*`,
                            ],
                        }),
                        new iam.PolicyStatement({
                            actions: ['cloudfront:*'],
                            resources: [`arn:aws:cloudfront::${cdk.Stack.of(this).account}:distribution/${props.distribution.distributionId}`],
                        }),
                    ],
                }),
            },
        });

        new cdk.CfnOutput(this, 'gitHubActionsRoleArn', {
            value: githubActionsRole.roleArn,
            exportName: `gitHubActionsRoleArn`,
        });
    }
}
