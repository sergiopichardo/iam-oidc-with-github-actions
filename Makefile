deploy:
	cdk deploy --all --profile default --require-approval never

destroy:
	cdk destroy --all --profile default