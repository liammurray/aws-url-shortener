# Lambda function code

Lambda function code for urls API

To run unit test:

```bash
npm run test
```

To run integration test:

```bash
npm run test:int
```

The integration test launches a temp dynamo table and runs tests on it. The table is given a unique name based on timestamp and host, etc. At the end it is removed. You must have AWS credentials set in your environment.
