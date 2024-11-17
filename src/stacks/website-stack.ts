import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as cloudfrontOrigins from "aws-cdk-lib/aws-cloudfront-origins";
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { getConfig } from '../../shared/config/get-config';

interface WebsiteStackProps extends cdk.StackProps {
  appName: string;
  websitePath: string;
  awsRegion: string;
}


export class WebsiteStack extends cdk.Stack {
  public readonly websiteBucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: WebsiteStackProps) {
    super(scope, id, props);

    this.websiteBucket = this._originBucket({
      appName: props.appName,
    });

    this.distribution = this._cloudfrontDistribution({
      appName: props.appName,
    });

    this._websiteDeployment({
      appName: props.appName,
      websitePath: props.websitePath,
    });

    new cdk.CfnOutput(this, `DistributionDomain-${props.appName}`, {
      value: this.distribution.distributionDomainName,
      exportName: `DistributionDomain-${props.appName}`,
    });

    new ssm.StringParameter(this, `${props.appName}-DistributionDomain-Parameter`, {
      description: 'Application Name',
      parameterName: `/${props.appName}/APP_NAME`,
      stringValue: props.appName,
      tier: ssm.ParameterTier.STANDARD,
    });

    new ssm.StringParameter(this, `${props.appName}-AWSRegion-Parameter`, {
      description: 'AWS region',
      parameterName: `/${props.appName}/AWS_REGION`,
      stringValue: props.awsRegion,
      tier: ssm.ParameterTier.STANDARD,
    });

    new ssm.StringParameter(this, `${props.appName}-AccountId-Parameter`, {
      description: 'AWS account ID',
      parameterName: `/${props.appName}/AWS_ACCOUNT_ID`,
      stringValue: cdk.Stack.of(this).account,
      tier: ssm.ParameterTier.STANDARD,
    });

    new ssm.StringParameter(this, `${props.appName}-BucketName-Parameter`, {
      description: 'The S3 website bucket name',
      parameterName: `/${props.appName}/S3_BUCKET_NAME`,
      stringValue: this.websiteBucket.bucketName,
      tier: ssm.ParameterTier.STANDARD,
    });

    new ssm.StringParameter(this, `${props.appName}-DistributionId-Parameter`, {
      description: 'The CloudFront distribution ID',
      parameterName: `/${props.appName}/CLOUDFRONT_DISTRIBUTION_ID`,
      stringValue: this.distribution.distributionId,
      tier: ssm.ParameterTier.STANDARD,
    });
  }

  private _originBucket(props: {
    appName: string;
  }): s3.Bucket {
    return new s3.Bucket(this, `${props.appName}WebsiteBucket`, {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });
  }

  private _cloudfrontDistribution(props: {
    appName: string;
  }): cloudfront.Distribution {
    return new cloudfront.Distribution(this, `${props.appName}Distribution`, {
      defaultBehavior: {
        origin: cloudfrontOrigins.S3BucketOrigin.withOriginAccessControl(this.websiteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: 'index.html',
    });
  }

  private _websiteDeployment(props: {
    appName: string;
    websitePath: string;
  }): s3deploy.BucketDeployment {
    return new s3deploy.BucketDeployment(this, `${props.appName}WebsiteDeployment`, {
      sources: [s3deploy.Source.asset(props.websitePath)],
      distribution: this.distribution,
      distributionPaths: ["/*"],
      destinationBucket: this.websiteBucket,
      retainOnDelete: false,
    });
  }
}