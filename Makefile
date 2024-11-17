deploy:
	cdk deploy --all --profile default --require-approval never

destroy:
	cdk destroy --all --profile default

postdeploy:
	ts-node ./helpers/ssm-params-to-secrets.ts