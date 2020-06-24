
#!/usr/bin/env bash
set -eu -o pipefail

STACK_NAME=urlshort-site

echo "Looking up output for stack ($STACK_NAME)..."
JSON=$(aws cloudformation describe-stacks --stack-name $STACK_NAME | jq '.Stacks[].Outputs | map({(.OutputKey): .})|add')

get() {
  local BLOB=$(jq -r ".$1.OutputValue" <<<$JSON 2>/dev/null)
  [ "${BLOB:-null}" == "null" ] && return 1
  echo $BLOB
}

bucketName=$(get Bucket)

prompt() {
  while true; do
    read -p "$1 " -n 1 -r yn
    echo
    case $yn in
        [Yy]* ) return 0;;
        [Nn]* ) return 1;;
        * ) echo "Please answer yes or no";;
    esac
  done
}

# --dryrun
CMD="aws s3 rm s3://$bucketName --recursive"

echo "This will run:"
echo "$CMD"

export AWS_PAGER=""
if prompt "Delete bucket contents?" ; then
  $CMD
fi





