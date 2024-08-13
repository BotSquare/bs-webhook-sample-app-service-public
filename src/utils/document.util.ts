import AWS from 'aws-sdk';

AWS.config.update({
    region: 'us-west-2',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});
const documentClient = new AWS.DynamoDB.DocumentClient();

export default documentClient;