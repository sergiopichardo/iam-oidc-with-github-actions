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
    githubThumbprintsList: string[];
}

export class GithubOidcStack extends cdk.Stack {

    // GitHub's OIDC provider domain that issues JWT tokens when GitHub Actions workflows run
    // These tokens contain claims about the workflow context (repository, branch, etc)
    // AWS uses this domain to verify the token signature and establish trust
    private readonly githubDomain = 'token.actions.githubusercontent.com';

    // Client ID for AWS STS service - used as the audience (aud) claim in GitHub's OIDC tokens
    // This allows GitHub Actions to authenticate with AWS using OIDC federation
    private readonly clientId = 'sts.amazonaws.com';

    private readonly props: GithubOidcStackProps;

    constructor(scope: Construct, id: string, props: GithubOidcStackProps) {
        super(scope, id, props);
        this.props = props;

        const githubProvider = this.createGithubProvider({
            url: `https://${this.githubDomain}`,
            appName: props.appName,
            githubThumbprintsList: props.githubThumbprintsList,
        });

        const conditions = this.createOidcConditions({
            allowedRepositories: props.allowedRepositories,
        });

        const githubActionsRole = this.setupIamConfiguration({
            appName: props.appName,
            originBucket: props.websiteBucket,
            distribution: props.distribution,
            githubProvider,
            conditions,
        });

        this.createOutputs({
            githubActionsRole,
        });
    }

    private createGithubProvider(props: {
        url: string;
        appName: string;
        githubThumbprintsList: string[];
    }): iam.OpenIdConnectProvider {
        return new iam.OpenIdConnectProvider(this, `${props.appName}GithubOidcProvider`, {
            url: props.url,
            clientIds: [this.clientId],
            thumbprints: props.githubThumbprintsList,
        });
    }

    private createOidcConditions(props: {
        allowedRepositories: string[];
    }): iam.Conditions {
        const allowedRepositories = props.allowedRepositories.map(repo => `repo:${repo}`);

        return {
            StringEquals: {
                [`${this.githubDomain}:aud`]: this.clientId,
            },
            StringLike: {
                [`${this.githubDomain}:sub`]: allowedRepositories,
            },
        };
    }

    private setupIamConfiguration(props: {
        appName: string,
        githubProvider: iam.OpenIdConnectProvider,
        conditions: iam.Conditions,
        originBucket: s3.Bucket,
        distribution: cloudfront.Distribution,
    }): iam.Role {
        const policyDocument = new iam.PolicyDocument({
            statements: [
                // S3 permissions
                new iam.PolicyStatement({
                    actions: ['s3:*'],
                    resources: [
                        props.originBucket.bucketArn,
                        `${props.originBucket.bucketArn}/*`,
                    ],
                }),
                // CloudFront permissions
                new iam.PolicyStatement({
                    actions: ['cloudfront:*'],
                    resources: [
                        `arn:aws:cloudfront::${cdk.Stack.of(this).account}:distribution/${props.distribution.distributionId}`
                    ],
                }),
            ],
        });

        return new iam.Role(this, 'GitHubActionsRole', {
            roleName: `${this.props.appName}GitHubActionsRole`,
            assumedBy: new iam.WebIdentityPrincipal(
                props.githubProvider.openIdConnectProviderArn,
                props.conditions,
            ),

            inlinePolicies: {
                'GitHubActionsPolicy': policyDocument,
            },
        });
    }

    private createOutputs(props: {
        githubActionsRole: iam.Role;
    }): void {
        new cdk.CfnOutput(this, 'gitHubActionsRoleArn', {
            value: props.githubActionsRole.roleArn,
            exportName: `gitHubActionsRoleArn`,
        });
    }
}
