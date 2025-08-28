#!/bin/bash

# TowerConnect AWS Deployment Script
# This script deploys the TowerConnect application to AWS ECS

set -e

# Configuration
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REPOSITORY="towerconnect"
ECS_CLUSTER="towerconnect-cluster"
ECS_SERVICE="towerconnect-service"
TASK_DEFINITION="towerconnect"

echo "🚀 Starting TowerConnect AWS Deployment..."
echo "Region: $AWS_REGION"
echo "Account ID: $AWS_ACCOUNT_ID"
echo "ECR Repository: $ECR_REPOSITORY"
echo ""

# Step 1: Create ECR repository if it doesn't exist
echo "📦 Setting up ECR repository..."
aws ecr describe-repositories --repository-names $ECR_REPOSITORY --region $AWS_REGION 2>/dev/null || {
    echo "Creating ECR repository: $ECR_REPOSITORY"
    aws ecr create-repository --repository-name $ECR_REPOSITORY --region $AWS_REGION
}

# Step 2: Get ECR login token
echo "🔐 Logging into ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Step 3: Build and tag Docker image
echo "🏗️ Building Docker image..."
docker build -t $ECR_REPOSITORY .

# Step 4: Tag and push to ECR
echo "📤 Pushing image to ECR..."
docker tag $ECR_REPOSITORY:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest

# Step 5: Create CloudWatch log group
echo "📊 Setting up CloudWatch logs..."
aws logs create-log-group --log-group-name "/ecs/$TASK_DEFINITION" --region $AWS_REGION 2>/dev/null || echo "Log group already exists"

# Step 6: Create Secrets Manager secret for session secret
echo "🔒 Setting up Secrets Manager..."
SESSION_SECRET=$(openssl rand -base64 32)
aws secretsmanager create-secret \
    --name "towerconnect/session-secret" \
    --description "Session secret for TowerConnect application" \
    --secret-string "{\"SESSION_SECRET\":\"$SESSION_SECRET\"}" \
    --region $AWS_REGION 2>/dev/null || echo "Secret already exists"

# Step 7: Update task definition
echo "📝 Updating ECS task definition..."
sed -i "s/ACCOUNT_ID/$AWS_ACCOUNT_ID/g" aws-deploy/ecs-task-definition.json
sed -i "s/REGION/$AWS_REGION/g" aws-deploy/ecs-task-definition.json

aws ecs register-task-definition \
    --cli-input-json file://aws-deploy/ecs-task-definition.json \
    --region $AWS_REGION

# Step 8: Create ECS cluster if it doesn't exist
echo "🏗️ Setting up ECS cluster..."
aws ecs create-cluster --cluster-name $ECS_CLUSTER --region $AWS_REGION 2>/dev/null || echo "Cluster already exists"

# Step 9: Create or update ECS service
echo "🔄 Updating ECS service..."
SERVICE_EXISTS=$(aws ecs describe-services --cluster $ECS_CLUSTER --services $ECS_SERVICE --region $AWS_REGION --query 'services[0].status' --output text 2>/dev/null || echo "NONE")

if [ "$SERVICE_EXISTS" = "ACTIVE" ]; then
    echo "Updating existing service..."
    aws ecs update-service \
        --cluster $ECS_CLUSTER \
        --service $ECS_SERVICE \
        --task-definition $TASK_DEFINITION \
        --region $AWS_REGION
else
    echo "Creating new service..."
    aws ecs create-service \
        --cluster $ECS_CLUSTER \
        --service-name $ECS_SERVICE \
        --task-definition $TASK_DEFINITION \
        --desired-count 1 \
        --launch-type FARGATE \
        --network-configuration "awsvpcConfiguration={subnets=[subnet-12345678],securityGroups=[sg-12345678],assignPublicIp=ENABLED}" \
        --region $AWS_REGION
fi

# Step 10: Wait for service to be stable
echo "⏳ Waiting for service to be stable..."
aws ecs wait services-stable \
    --cluster $ECS_CLUSTER \
    --services $ECS_SERVICE \
    --region $AWS_REGION

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Deployment Summary:"
echo "  - ECR Repository: $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY"
echo "  - ECS Cluster: $ECS_CLUSTER"
echo "  - ECS Service: $ECS_SERVICE"
echo "  - Task Definition: $TASK_DEFINITION"
echo ""
echo "🔗 Next Steps:"
echo "  1. Set up Application Load Balancer (ALB) to route traffic to your service"
echo "  2. Configure custom domain and SSL certificate"
echo "  3. Set up monitoring and alerting"
echo "  4. Configure auto-scaling policies"
echo ""
echo "📊 Monitor your deployment:"
echo "  - ECS Console: https://console.aws.amazon.com/ecs/home?region=$AWS_REGION"
echo "  - CloudWatch Logs: https://console.aws.amazon.com/cloudwatch/home?region=$AWS_REGION#logsV2:log-groups/log-group/\$252Fecs\$252F$TASK_DEFINITION"

