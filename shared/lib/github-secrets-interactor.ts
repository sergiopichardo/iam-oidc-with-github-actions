import { execSync } from 'child_process';
import { getConfig } from '../config/get-config';

export const createGithubSecrets = (secrets: { key: string, value: string }[]) => {
    for (const { key, value } of secrets) {
        execSync(`gh secret set ${key} --body "${value}"`, {
            stdio: 'inherit'
        });
    }
}

export const deleteGithubSecrets = (secrets: { key: string, value?: string }[]) => {
    for (const { key } of secrets) {
        try {

            execSync(`gh secret remove ${key} 2>/dev/null && echo "Deleted ${key}"`, {
                /*
                  This array represents [stdin, stdout, stderr], where:
                    -  'inherit' for stdin keeps input handling
                    - 'inherit' for stdout allows normal output
                    -  'ignore' for stderr suppresses error messages
                    
                   This achieves the same effect as 2>/dev/null in bash while maintaining the rest of the functionality.
                */
                stdio: ['inherit', 'inherit', 'ignore'],
            });

        } catch (error) {
            // Suppress errors similar to 2>/dev/null in bash
            console.log(`Secret ${key} not found or already deleted`);
        }
    }
}

// Testing
// deleteGithubSecrets([
//     { key: 'AWS_ACCOUNT_ID', value: getConfig('awsAccountId') },
//     { key: 'AWS_REGION', value: getConfig('awsRegion') },
// ]);
// createGithubSecrets([
//     { key: 'AWS_ACCOUNT_ID', value: getConfig('awsAccountId') },
//     { key: 'AWS_REGION', value: getConfig('awsRegion') },
// ]);