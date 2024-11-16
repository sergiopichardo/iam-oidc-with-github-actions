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
    githubThumbprintsList?: string[];
    existingProviderArn?: string;
}

export class GithubOidcStack extends cdk.Stack {

    // GitHub's OIDC provider domain that issues JWT tokens when GitHub Actions workflows run
    // These tokens contain claims about the workflow context (repository, branch, etc)
    // AWS uses this domain to verify the token signature and establish trust
    private readonly githubDomain = 'token.actions.githubusercontent.com';

    // Client ID for AWS STS service - used as the audience (aud) claim in GitHub's OIDC tokens
    // This allows GitHub Actions to authenticate with AWS using OIDC federation
    private readonly clientId = 'sts.amazonaws.com';

    constructor(scope: Construct, id: string, props: GithubOidcStackProps) {
        super(scope, id, props);

        // Instead of creating a new provider
        const provider = this.getOrCreateGithubProvider({
            appName: props.appName,
            githubThumbprintsList: props.githubThumbprintsList,
            providerUrl: `https://${this.githubDomain}`,
            clientIdsList: [this.clientId],
            existingProviderArn: props.existingProviderArn,
        });

        const conditions = this.createOidcConditions({
            allowedRepositories: props.allowedRepositories,
        });

        const githubActionsRole = this.setupIamConfiguration({
            appName: props.appName,
            originBucket: props.websiteBucket,
            distribution: props.distribution,
            githubProvider: provider,
            conditions,
        });

        this.createOutputs({
            githubActionsRole,
            appName: props.appName,
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
        githubProvider: iam.IOpenIdConnectProvider,
        conditions: iam.Conditions,
        originBucket: s3.Bucket,
        distribution: cloudfront.Distribution,
    }): iam.Role {
        const policyDocument = new iam.PolicyDocument({
            // TODO: restrict policies to only allow specific actions
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

        return new iam.Role(this, `${props.appName}GitHubActionsRole`, {
            roleName: `${props.appName}GitHubActionsRole`,
            assumedBy: new iam.WebIdentityPrincipal(
                props.githubProvider.openIdConnectProviderArn,
                props.conditions,
            ),

            inlinePolicies: {
                [`${props.appName}GitHubActionsPolicy`]: policyDocument,
            },
        });
    }

    private createOutputs(props: {
        githubActionsRole: iam.Role;
        appName: string;
    }): void {
        new cdk.CfnOutput(this, `${props.appName}GitHubActionsRoleArn`, {
            value: props.githubActionsRole.roleArn,
            exportName: `${props.appName}GitHubActionsRoleArn`,
        });
    }

    private getOrCreateGithubProvider(props: {
        appName: string;
        githubThumbprintsList?: string[];
        providerUrl: string;
        clientIdsList: string[];
        existingProviderArn?: string;
    }): iam.IOpenIdConnectProvider {

        let provider: iam.IOpenIdConnectProvider;

        if (props.existingProviderArn) {
            provider = iam.OpenIdConnectProvider.fromOpenIdConnectProviderArn(this,
                `${props.appName}GithubProvider`,
                props.existingProviderArn as string,
            );

            if (provider) return provider;
        }

        provider = new iam.OpenIdConnectProvider(this, `${props.appName}GithubProvider`, {
            url: props.providerUrl,
            clientIds: props.clientIdsList,
            // Thumbprints are used by AWS to verify the authenticity of GitHub's OIDC tokens
            // If AWS can't verify the token through standard OIDC verification,
            // it will validate the token's signature using these certificate thumbprints
            // as a fallback mechanism to establish trust
            thumbprints: props.githubThumbprintsList,
        });

        return provider;
    }
}
