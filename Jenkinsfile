// ***********************
//
// Build and deploy different environments with jenkins pipeline
//
// Merge to develop -> triggers development release
// Merge to master without tag -> triggers staging release
// Merge to master with tag -> triggers staging and production release
// Production release requires manual approval on the jenkins job
//
// Configure jenkins pipeline project to pull tags! By default, tags are not pulled!
// -> Check "Advanced clone behaviours" feature of jenkins git plugin
//
// ***********************


def CONTAINER_NAME="rnssolutions/binance_plus-backend"
def CONTAINER_TAG="0.0.1"
def DOCKER_HUB_USER="rnssolutions"


pipeline {
    agent {label params.node}

    tools {nodejs "NodeJS16.6.0"}

    environment {
        GLOBAL_ENVIRONMENT = 'NO_DEPLOYMENT'
        // Need the staging properties anyway to deploy to staging and production simultaneously when doing a prod release
        ENVIRONMENT_STAGING = 'staging'
    }

    options {
        // Keep maximum 10 archived artifacts
        buildDiscarder(logRotator(numToKeepStr: '10', artifactNumToKeepStr: '10'))

        // No simultaneous builds
        disableConcurrentBuilds()
    }

    post {
        always {

          discordSend description: 'Jenkins Pipeline Build', footer:  '' , link: env.BUILD_URL, result: currentBuild.currentResult, unstable: false, title: JOB_NAME, webhookURL: 'https://discordapp.com/api/webhooks/950283587037589545/FkP1t7ciO_oddqUVjQkE061_yiozYQ3oijgy_de3lxm4PD41trS1eLF5c-128vWku-76'
        }
    }

    stages {
        stage('Prepare workspace') {
            steps {
                echo 'Prepare workspace'

                // Clean workspace
                step([$class: 'WsCleanup'])

                // Checkout git
                checkout scm
            }
        }

        stage('Setup environment') {
            steps {
                echo 'Setup environment'

                script {
                    // Determine whether this is a test or a staging / production build
                    switch (env.BRANCH_NAME) {
                        case 'development':
                            GLOBAL_ENVIRONMENT = 'development'
                            break
                        case 'testing':
                            GLOBAL_ENVIRONMENT = 'testing'
                            break
                        case 'staging':
                            GLOBAL_ENVIRONMENT = 'staging'
                            break
                        case 'master':
                            GLOBAL_ENVIRONMENT = 'production'
                            break
                        default:
                            GLOBAL_ENVIRONMENT = 'NO_DEPLOYMENT'
                            break
                    }

                    // Get tag on current branch
                    TAG = sh(returnStdout: true, script: 'git tag --points-at HEAD')

                    echo 'Branch To Build'
                    echo env.BRANCH_NAME

                    if (TAG && GLOBAL_ENVIRONMENT == 'staging') {
                        echo 'Build for production'

                        // Ask user whether master should be builded and deployed to production
                        try {
                            timeout(time: 15, unit: 'MINUTES') {
                                APPROVED = input(
                                    id: 'BuildForProductionInput',
                                    message: 'Build and deploy',
                                    parameters: [
                                        booleanParam(
                                            defaultValue: false,
                                            description: '',
                                            name: 'Build and deploy ' + TAG + ' for production?'
                                        )
                                    ]
                                )

                                if (APPROVED) {
                                    GLOBAL_ENVIRONMENT = 'production'
                                } else {
                                    error 'Build for production aborted'
                                }
                            }
                        } catch (err) {
                            error 'Build for production aborted'
                        }
                    }
                }
            }
        }

        stage('Build') {
            steps {
                echo 'Build ' + GLOBAL_ENVIRONMENT

                script {
                    if (GLOBAL_ENVIRONMENT == 'NO_DEPLOYMENT') {
                        echo 'This is not develop nor master branch and should not be build'
                    } else {

                        build(GLOBAL_ENVIRONMENT)

                        if (GLOBAL_ENVIRONMENT == 'production') {
                            echo 'Additionally, build staging'
                        }
                    }
                }
            }
        }
        


        stage('Deploy') {
            steps {
                echo 'Deploy ' + GLOBAL_ENVIRONMENT

                script {
                    if (GLOBAL_ENVIRONMENT == 'NO_DEPLOYMENT') {
                        echo 'This is not develop nor master branch and should not be deployed'
                    } else {
                        deploy(GLOBAL_ENVIRONMENT)

                        if (GLOBAL_ENVIRONMENT == 'production') {
                            echo 'Additionally, deploy staging'
                        }
                    }
                }
            }
        }
    }
}

def build(ENVIRONMENT) {

  echo 'started building image...'
  echo 'Build ENV ' + ENVIRONMENT
  sh './jenkins/scripts/docker-build.sh'

}
def deploy(ENVIRONMENT) {
    echo 'started deploying'
    sh 'chmod +x ./jenkins/scripts/remote-deploy.sh'
    sh './jenkins/scripts/remote-deploy.sh'
}