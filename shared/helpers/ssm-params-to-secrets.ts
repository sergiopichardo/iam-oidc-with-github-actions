import { getConfig } from '../config/get-config';
import { parameterToEnvarMapper } from '../lib/parameter-to-envar-mapper';
import { createGithubSecrets, deleteGithubSecrets } from '../lib/github-secrets-interactor';
import { getAllSsmParameters } from '../lib/ssm-parameter-interactor';


/**
 * Process SSM parameters and create GitHub secrets
 */
async function ssmParamsToSecrets() {
    const appName = getConfig('appName');
    try {
        const secrets = await getAllSsmParameters([
            { ssmKey: `/${appName}/APP_NAME` },
            { ssmKey: `/${appName}/AWS_REGION` },
            { ssmKey: `/${appName}/AWS_ACCOUNT_ID` },
            { ssmKey: `/${appName}/ROLE_TO_ASSUME_ARN` },
            { ssmKey: `/${appName}/S3_BUCKET_NAME` },
            { ssmKey: `/${appName}/CLOUDFRONT_DISTRIBUTION_ID` }
        ]);

        const envarNameRegex = /.*\/([^/]+)$/; // e.g. /my-app/APP_NAME -> APP_NAME
        const envarNameMapping = parameterToEnvarMapper(secrets, envarNameRegex);

        deleteGithubSecrets(envarNameMapping); // Delete first to avoid conflicts
        createGithubSecrets(envarNameMapping); // Then create new secrets
    } catch (error) {
        console.error('Failed to generate or update secrets:', error);
    }
}

ssmParamsToSecrets();