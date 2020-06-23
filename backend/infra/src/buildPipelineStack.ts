import * as cdk from '@aws-cdk/core'
import { BuildPipeline, BuildPipelineProps, makeBaseProps } from '@liammurray/cdk-common'

export interface BuildPipelineStackProps extends cdk.StackProps {
  readonly devApiStackName: string
}

export default class BuildPipelineStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: BuildPipelineStackProps) {
    super(scope, id, props)

    const serviceName = 'UrlShortener'

    const baseOpts = makeBaseProps(this, serviceName, 'master')
    const pipelineOpts: BuildPipelineProps = {
      ...baseOpts,
      // Use SAM for now
      buildSpec: 'backend/buildspec-sam.yml',
      stageDev: {
        // Should match Makefile if you want to deploy with make deploy from laptop
        stackName: `${serviceName}-dev`,
      },
      stageLive: undefined,
    }

    new BuildPipeline(this, 'BuildPipeline', pipelineOpts)
  }
}

/**
 * FUTURE using CDK
 *  CDK assets (for lambda) don't work yet in CI.
 *  see [cdk package command needed](https://github.com/aws/aws-cdk/issues/1312). This doesn't quite work yet.
 */

// export class BuildPipelineStackCdk extends cdk.Stack {
//   constructor(scope: cdk.Construct, id: string, props: BuildPipelineStackProps) {
//     super(scope, id, props)

//     const serviceName = 'UrlShortener'

//     const baseOpts = makeBaseProps(this, serviceName, 'master')
//     const pipelineOpts: BuildPipelineProps = {
//       ...baseOpts,
//       buildSpec: 'backend/buildspec.yml',
//       stageDev: {
//         stackName: `${serviceName}-dev`,
//         deployTemplate: `${props.devApiStackName}.template.json`,
//       },
//       stageLive: undefined,
//     }

//     new BuildPipeline(this, 'BuildPipeline', pipelineOpts)
//   }
// }
