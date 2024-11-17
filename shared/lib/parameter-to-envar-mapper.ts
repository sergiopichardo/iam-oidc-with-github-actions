/**
 * Map SSM parameters to environment variables object
 * @param mapping - The mapping of SSM keys to environment variable names
 *          e.g. [
 *              { ssmKey: '/my-app/appName', envarName: 'APP_NAME' },
 *              { ssmKey: '/my-app/awsAccountId', envarName: 'AWS_ACCOUNT_ID' }
 *          ]
 * @returns The environment variables object
 *          e.g. { APP_NAME: 'my-app', AWS_ACCOUNT_ID: '1234567890' }
 */
export const parameterToEnvarMapper = (
    mapping: { key: string, value: string }[],
    regex: RegExp // Regex with capture group for last segment
): { key: string, value: string }[] => {
    const envarMapping: { key: string, value: string }[] = [];

    mapping.forEach((item) => {
        const { key, value } = item;
        const match = key.match(regex);
        const transformedKey = match ? match[1] : key; // Use the captured group at index 1

        envarMapping.push({ key: transformedKey, value });
    });

    return envarMapping;
}

// Testing
// const regex = /.*\/([^/]+)$/;
// console.log(parameterToEnvarMapper([
//     { key: '/OidcWithGithubActions/APP_NAME', value: 'OidcWithGithubActions' },
//     { key: '/OidcWithGithubActions/AWS_REGION', value: 'us-east-1' }
// ], regex));