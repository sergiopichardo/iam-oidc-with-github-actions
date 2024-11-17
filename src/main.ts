#!/usr/bin/env node
import 'source-map-support/register';
import * as path from 'path';

import * as cdk from 'aws-cdk-lib';
import { WebsiteStack } from './stacks/website-stack';
import { GithubOidcStack } from './stacks/github-oidc-stack';

import * as dotenv from 'dotenv';
import { getConfig } from '../shared/config/get-config';

dotenv.config();


const app = new cdk.App();
const appName = getConfig('appName');

const websiteStack = new WebsiteStack(app, `${appName}-WebsiteStack`, {
  appName,
  websitePath: path.join(__dirname, '..', 'site'),
  awsRegion: getConfig('awsRegion'),
});

new GithubOidcStack(app, `${appName}-GithubOidcStack`, {
  appName,
  distribution: websiteStack.distribution,
  websiteBucket: websiteStack.websiteBucket,
  allowedRepositories: getConfig('allowedRepositories').split(','),
  githubThumbprintsList: getConfig('githubThumbprintsList').split(','),
  existingProviderArn: getConfig('existingProviderArn'),
});
