# Url Shortner

Simple API GW url shortener service example using:

- AWS SAM
  - Uses makefiles to compile typescript instead of SAM build
- Typesript
- DynamoDb using [dynamodb-datamapper-js](https://github.com/awslabs/dynamodb-data-mapper-js)

Shortened URL example:

`http://nod15c.com/1gpgLAJ`

## Quickstart

```bash
make deploy
#TODO (dns and auth)
curl -X POST  https://dev-api.nod15c.com/urls?url=https://www.google.com
```

## TODO

- Support custom name as in: `http://nod15c.com/custom_name`
- CDK
- Validate submitted URL
- Expiration
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
