deploy:
	cdk deploy --all --profile default --require-approval never

destroy:
	cdk destroy --all --profile default

postdeploy:
	ts-node ./shared/scripts/generate-or-update-github-secrets.ts
