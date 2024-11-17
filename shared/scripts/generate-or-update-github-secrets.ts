import { getConfig } from '../config/get-config';
import { parameterToEnvarMapper } from '../lib/parameter-to-envar-mapper';
import { createGithubSecrets, deleteGithubSecrets } from '../lib/github-secrets-interactor';
import { getAllSsmParameters } from '../lib/ssm-parameter-interactor';


/**
 * Generate or update GitHub secrets
 */
async function generateOrUpdateSecrets() {
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

        const getParamNameRegex = /.*\/([A-Z_0-9a-z]+)$/;
        const envarMapping = parameterToEnvarMapper(secrets, getParamNameRegex);
        console.log(envarMapping);

        deleteGithubSecrets(envarMapping); // Delete first to avoid conflicts
        createGithubSecrets(envarMapping); // Then create new secrets
    } catch (error) {
        console.error('Failed to generate or update secrets:', error);
    }
}

generateOrUpdateSecrets();

