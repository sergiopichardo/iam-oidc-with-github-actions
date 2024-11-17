import { getConfig } from '../config/get-config';
import { parameterToEnvarName } from '../lib/parameter-to-envar-mapping';
import { createGithubSecrets, deleteGithubSecrets } from '../lib/github-secrets-interactor';
import { getAllSsmParameters } from '../lib/ssm-parameters-interactor';


/**
 * Process SSM parameters and create GitHub secrets
 */
async function ssmParamsToSecrets() {
    const appName = getConfig('appName');
    try {
        const secrets = await getAllSsmParameters([
            { ssmKey: `/${appName}/APP_NAME` },
            { ssmKey: `/${appName}/AWS_ACCOUNT_ID` },
            { ssmKey: `/${appName}/AWS_REGION` },
            { ssmKey: `/${appName}/ROLE_TO_ASSUME_ARN` },
            { ssmKey: `/${appName}/S3_BUCKET_NAME` },
            { ssmKey: `/${appName}/CLOUDFRONT_DISTRIBUTION_ID` }
        ]);

        const envarNameRegex = /.*\/([A-Z_]+)$/;
        const envarNameMapping = parameterToEnvarName(secrets, envarNameRegex);

        deleteGithubSecrets(envarNameMapping); // Delete first to avoid conflicts
        createGithubSecrets(envarNameMapping); // Then create new secrets
    } catch (error) {
        console.error('Failed to generate or update secrets:', error);
    }
}

ssmParamsToSecrets();