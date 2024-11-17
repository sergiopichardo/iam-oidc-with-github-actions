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
export const parameterToEnvarName = (
    mapping: { key: string, value: string }[],
    regex: RegExp
): { key: string, value: string }[] => {

    const envarMapping: { key: string, value: string }[] = [];

    mapping.forEach((item) => {
        const { key, value } = item;

        const transformedKey = key.replace(regex, '');

        envarMapping.push({ key: transformedKey, value: value });
    });

    return envarMapping;
}
