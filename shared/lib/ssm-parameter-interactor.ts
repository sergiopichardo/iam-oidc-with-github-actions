import {
    SSMClient,
    GetParameterCommand,
    GetParameterCommandInput,
    GetParameterCommandOutput,
    SSMClientConfig
} from '@aws-sdk/client-ssm';

/**
 * Get a parameter from AWS SSM
 * @param parameterName - The name of the parameter to get
 * @param ssmClientConfig - The configuration for the SSM client
 * @returns The value of the parameter
 */
export const getSsmParameter = async (parameterName: string, ssmClientConfig?: SSMClientConfig) => {
    const client = new SSMClient(ssmClientConfig as SSMClientConfig || {});

    const getParameterInput: GetParameterCommandInput = {
        Name: parameterName,
        WithDecryption: true, // return decrypted value
    };

    try {
        const command = new GetParameterCommand(getParameterInput);
        const response: GetParameterCommandOutput = await client.send(command);

        return response.Parameter?.Value;
    } catch (error) {
        console.error(`Error getting parameter ${parameterName}:`, error);
        throw error;
    }
};


/**
 * Get all SSM parameters
 * @param parameterKeys - The keys of the parameters to get
 * @param ssmClientConfig - The configuration for the SSM client
 * @returns The parameters
 *          e.g. { '/my-app/APP_NAME': 'my-app', '/my-app/AWS_ACCOUNT_ID': '1234567890' }   
 */
export const getAllSsmParameters = async (
    parameterKeys: { ssmKey: string }[],
    ssmClientConfig?: SSMClientConfig
): Promise<{ key: string, value: string }[]> => {
    const client = new SSMClient(ssmClientConfig as SSMClientConfig || {});

    try {
        const parameterPromises = parameterKeys.map(async (item) => {
            const { ssmKey } = item;

            const parameter = await getSsmParameter(ssmKey, client);

            if (!parameter) {
                throw new Error(`Parameter ${ssmKey} not found`);
            }

            return { key: ssmKey, value: parameter };
        });

        return await Promise.all(parameterPromises);
    } catch (error) {
        console.error('Error getting SSM parameters:', error);
        throw error;
    }
}

// Testing
// getAllSsmParameters([
//     { ssmKey: '/OidcWithGithubActions/APP_NAME' },
//     { ssmKey: '/OidcWithGithubActions/AWS_ACCOUNT_ID' },
// ]).then((parameters) => {
//     console.log(parameters);
// });