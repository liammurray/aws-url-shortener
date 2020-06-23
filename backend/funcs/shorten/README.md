# Lambda function code

Lambda function code for urls API

To run integration test:

```bash
npm run test:int
```

To run test: 

```bash
npm run test
```

The integration test launches a temp dynamo table and runs tests on it. The table is given a unique name based on timestamp and host, etc.