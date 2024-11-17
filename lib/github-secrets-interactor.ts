import { execSync } from 'child_process';

export const createGithubSecrets = (secrets: { [key: string]: string }) => {
    for (const [key, value] of Object.entries(secrets)) {
        execSync(`gh secret set ${key} --body "${value}"`, {
            stdio: 'inherit'
        });
    }
}

export const deleteGithubSecrets = (secrets: { [key: string]: string }) => {
    for (const [key, _] of Object.entries(secrets)) {
        try {
            execSync(`gh secret remove ${key}`, {
                stdio: 'inherit'
            });
            console.log(`Deleted ${key}`);
        } catch (error) {
            // Suppress errors similar to 2>/dev/null in bash
            console.log(`Secret ${key} not found or already deleted`);
        }
    }
}