import { Construct } from 'constructs';
import * as AmplifyHelpers from '@aws-amplify/cli-extensibility-helper';
import { AmplifyDependentResourcesAttributes } from '../../types/amplify-dependent-resources-ref';
import {
  aws_lambda as lambda,
  aws_iam as iam,
  aws_logs as logs,
  CustomResource,
  Stack,
  StackProps,
  Duration,
  CfnParameter,
  CfnOutput,
} from 'aws-cdk-lib'
import * as fs from 'fs'

export class cdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps, amplifyResourceProps?: AmplifyHelpers.AmplifyResourceProps) {
    super(scope, id, props);
    /* Do not remove - Amplify CLI automatically injects the current deployment environment in this input parameter */
    new CfnParameter(this, 'env', {
      type: 'String',
      description: 'Current Amplify CLI env name',
    });

    const { envName } = AmplifyHelpers.getProjectInfo()

    const graphQLId = new CfnParameter(this, 'apiprojectNameGraphQLAPIIdOutput', {
      type: 'String',
    });
    const tableName = `TestDataTable-${graphQLId.valueAsString}-${envName}`
    const tableArn = Stack.of(this).formatArn({
      service: 'dynamodb',
      resource: 'table',
      resourceName: tableName,
    })

    const funcFileName = 'putItem'

    const func = new lambda.SingletonFunction(this, 'lambdaBackedCr', {
      uuid: '307fe18e-5ab4-11ed-9b6a-0242ac120002',
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromInline(fs.readFileSync(`${__dirname}/${funcFileName}.js`, { encoding: 'utf-8' })),
      handler: 'index.handler',
      timeout: Duration.seconds(30),
      logRetention: logs.RetentionDays.ONE_DAY,
      // optional
      lambdaPurpose: 'forAmplifyCustomResource',
    })

    func.role.addToPrincipalPolicy(new iam.PolicyStatement(
      {
        actions: [
          'dynamodb:*'
        ],
        resources: [
          tableArn,
          `${tableArn}/*`
        ]
      }
    ))

    const customResource = new CustomResource(this, 'crPutItem', {
      serviceToken: func.functionArn,
      properties: {
        id: 'test-idd',
        tableName,
      }
    })

    new CfnOutput(this, "response", {
      value: customResource.getAtt('Response').toString()
    });
  }
}