deploy:
	cdk deploy --all --profile default --require-approval never --outputs-file ./cdk-outputs.json


destroy:
	cdk destroy --all --profile default