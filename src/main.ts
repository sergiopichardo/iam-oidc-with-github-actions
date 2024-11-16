#!/usr/bin/env node
import 'source-map-support/register';
import * as path from 'path';

import * as cdk from 'aws-cdk-lib';
import { WebsiteStack } from './website-stack';
import { GithubOidcStack } from './github-oidc-stack';

import * as dotenv from 'dotenv';

dotenv.config();

const appName = 'OidcWithGithubActions';

const app = new cdk.App();

const websiteStack = new WebsiteStack(app, `${appName}-WebsiteStack`, {
  appName,
  websitePath: path.join(__dirname, '..', 'site'),
});

const allowedRepositories = process.env.ALLOWED_REPOSITORIES?.split(',') ?? [];
const githubThumbprintsList = process.env.EXISTING_GITHUB_THUMBPRINTS?.split(',') ?? [];
const existingProviderArn = process.env.EXISTING_GITHUB_PROVIDER_ARN;

new GithubOidcStack(app, `${appName}-GithubOidcStack`, {
  appName,
  distribution: websiteStack.distribution,
  websiteBucket: websiteStack.websiteBucket,
  allowedRepositories,
  githubThumbprintsList,
  existingProviderArn,
});
