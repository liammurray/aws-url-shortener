import * as cdk from '@aws-cdk/core'
import { BuildPipeline, BuildPipelineProps, makeBaseProps } from '@liammurray/cdk-common'

export interface BuildPipelineStackProps extends cdk.StackProps {
  readonly devApiStackName: string
}

export default class BuildPipelineStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: BuildPipelineStackProps) {
    super(scope, id, props)

    const serviceName = 'UrlShortner'

    const baseOpts = makeBaseProps(this, serviceName, 'master')
    const pipelineOpts: BuildPipelineProps = {
      ...baseOpts,
      // Remove once in ssm under /cicd/UrlShortner/github/repo
      repo: 'aws-url-shortener',
      stageDev: {
        stackName: `${serviceName}-dev`,
        deployTemplate: `${props.devApiStackName}.template.json`,
      },
      stageLive: undefined,
    }

    new BuildPipeline(this, 'BuildPipeline', pipelineOpts)
  }
}
