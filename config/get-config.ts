export interface IAppConfig {
    appName: string;
    awsAccount: string;
    awsRegion: string;
    allowedRepositories: string;
    githubThumbprintsList: string;
    existingProviderArn: string;
}

import * as dotenv from "dotenv";
dotenv.config();

export const getConfig = (key: keyof IAppConfig): string => {

    const {
        APP_NAME,
        AWS_ACCOUNT,
        AWS_REGION,
        ALLOWED_REPOSITORIES,
        EXISTING_GITHUB_THUMBPRINTS,
        EXISTING_GITHUB_PROVIDER_ARN,
    } = process.env;

    if (!APP_NAME) {
        throw new Error("APP_NAME is not set");
    }

    if (!AWS_ACCOUNT) {
        throw new Error("AWS_ACCOUNT is not set");
    }

    if (!AWS_REGION) {
        throw new Error("AWS_REGION is not set");
    }

    if (!ALLOWED_REPOSITORIES) {
        throw new Error("ALLOWED_REPOSITORIES is not set");
    }

    if (!EXISTING_GITHUB_THUMBPRINTS) {
        throw new Error("EXISTING_GITHUB_THUMBPRINTS is not set");
    }

    if (!EXISTING_GITHUB_PROVIDER_ARN) {
        throw new Error("EXISTING_GITHUB_PROVIDER_ARN is not set");
    }

    const configMap: IAppConfig = {
        appName: APP_NAME,
        awsAccount: AWS_ACCOUNT,
        awsRegion: AWS_REGION,
        allowedRepositories: ALLOWED_REPOSITORIES,
        githubThumbprintsList: EXISTING_GITHUB_THUMBPRINTS,
        existingProviderArn: EXISTING_GITHUB_PROVIDER_ARN,
    };

    return configMap[key] as string;
};
