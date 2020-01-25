# Url Shortner

Simple API GW url shortener service example using:

- AWS SAM
- Typesript
- [aws-embedded-metrics-node](https://github.com/awslabs/aws-embedded-metrics-node) for logging embedded metrics
  - Also see [AWS blog](https://aws.amazon.com/blogs/developer/introducing-the-amazon-dynamodb-datamapper-for-javascript-developer-preview/)
- DynamoDb using [dynamodb-datamapper-js](https://github.com/awslabs/dynamodb-data-mapper-js)

Shortened URL example:

`http://nod15c.com/1gpgLAJ`

## TODO

- Support custom name as in: `http://nod15c.com/custom_name`
- Swagger
- Validate submitted URL
- Expiration
- Metrics
- Frontend (React)

## Local

### Dynamo

Run local database

```bash
   docker run -p 8000:8000 -d --name dynamodb amazon/dynamodb-local
   aws dynamodb list-tables --endpoint-url http://localhost:8000
```

Create table (name in JSON should match naem in template.yml)

```bash
 aws dynamodb create-table --cli-input-json file://tools/json/create-urls-table.json --endpoint-url http://localhost:8000
```

Cleanup

```bash
 aws dynamodb delete-table --table-name UrlEntries-dev --endpoint-url http://localhost:8000
 docker stop dynamodb
```

### API Gateway

```bash
   make build
   make api
   curl -X GET -s http://127.0.0.1:3000/123 | jq
   curl -X POST -s http://127.0.0.1:3000/url?url=https://www.google.com
   curl -kv -X GET -s http://127.0.0.1:3000/<shortid>
```

## SAM

Makefiles are used to compile typescript and stage lambda function code with only production dependencies installed.

We skip `sam build` since makefile handles that step. Normally `sam build` produces an intermediate SAM template under `.aws-sam/build` that updates code URIs to point to lambda code under that directory, and `sam package` uses that template as input.

In our case we use the original SAM template (as input to `sam package`) with code URIs pointing to locations where `make lambda` stages the code.

## Dynamo

Great [readable summary](https://gist.github.com/jlafon/d8f91086e3d00c4bff3b)

- Hash key: Alone uniquely ids item
- Hash plus range (sort) key: Combined uniquely id item

You denormalize data with document dbs (vs relational where you normalize).
You perform joins with normalized data.
