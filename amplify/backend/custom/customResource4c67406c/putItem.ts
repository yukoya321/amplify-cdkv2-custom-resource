import * as cfnresponse from 'cfn-response'
import * as AWS from 'aws-sdk'
import { Context, CloudFormationCustomResourceEvent } from 'aws-lambda';


exports.handler = (event: CloudFormationCustomResourceEvent, context: Context) => {
  console.log(JSON.stringify(event));
  console.log(JSON.stringify(context));
  const client = new AWS.DynamoDB();

  try {
    const {
      id,
      tableName,
    } = event.ResourceProperties
    switch (event.RequestType) {
      case 'Create': {
        client.putItem({
          TableName: tableName as string,
          Item: {
            'id': { S: id },
            'data, id': { S: Math.random().toString(32).substring(2) },
          }
        }, (err, res) => {
          console.log(res, err)
          const data = {
            'Response': JSON.stringify(res)
          };
          cfnresponse.send(event, context, cfnresponse.SUCCESS, data, id);
          return
        })
      }
        break;
      case 'Update':
        client.putItem({
          TableName: tableName as string,
          Item: {
            'id': { S: id },
            'data': { S: Math.random().toString(32).substring(2) },
            'old': { S: JSON.stringify(event.OldResourceProperties) },
          }
        }, (err, res) => {
          console.log(res, err)
          const data = {
            'Response': JSON.stringify(res)
          };
          cfnresponse.send(event, context, cfnresponse.SUCCESS, data, id);
          return
        })

        break;

      case 'Delete':
        const data = {
          'Response': 'delete'
        };
        cfnresponse.send(event, context, cfnresponse.SUCCESS, data, id);
        break;

      default:
        break;
    }
  } catch (error) {
    console.log(error);
    cfnresponse.send(event, context, cfnresponse.FAILED, {});
  }
  return
};