#!/usr/bin/env node
import 'source-map-support/register';
import * as path from 'path';

import * as cdk from 'aws-cdk-lib';
import { WebsiteStack } from './website-stack';
import { GithubOidcStack } from './github-oidc-stack';

const appName = 'OidcWithGithubActions';

const app = new cdk.App();

const websiteStack = new WebsiteStack(app, `${appName}-WebsiteStack`, {
  appName,
  websitePath: path.join(__dirname, '..', 'site'),
});

new GithubOidcStack(app, `${appName}-GithubOidcStack`, {
  appName,
  distribution: websiteStack.distribution,
  websiteBucket: websiteStack.websiteBucket,
  allowedRepositories: ['sergiopichardo/iam-oidc-with-github-actions'],
  githubThumbprintsList: ['d89e3bd43d5d909b47a18977aa9d5ce36cee184c'],
});
