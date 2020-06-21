#!/usr/bin/env bash


echo "Looking up tables..."

found=$(aws dynamodb list-tables --query 'TableNames' | jq -r '.[]' | grep '^urls-database-integ')

if [[ -z $found ]] ; then
  echo "No tables found matching prefix"
  exit 0
fi

echo "Found:"
echo $found | tr " " "\n"


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

export AWS_PAGER=""
if prompt "Continue (you will be prompted per table)?" ; then
  for db in $found ; do
    if prompt "Delete? $db" ; then
      aws dynamodb delete-table --table-name $db
    fi
  done
fi





