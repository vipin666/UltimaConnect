#!/bin/bash

# TowerConnect AWS Deployment with Terraform
# This script uses Terraform to provision infrastructure and deploy the application

set -e

# Configuration
AWS_REGION="us-east-1"
TERRAFORM_DIR="aws-deploy/terraform"

echo "🚀 Starting TowerConnect AWS Deployment with Terraform..."
echo "Region: $AWS_REGION"
echo ""

# Step 1: Check prerequisites
echo "🔍 Checking prerequisites..."
command -v terraform >/dev/null 2>&1 || { echo "❌ Terraform is required but not installed. Aborting." >&2; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed. Aborting." >&2; exit 1; }
command -v aws >/dev/null 2>&1 || { echo "❌ AWS CLI is required but not installed. Aborting." >&2; exit 1; }

# Step 2: Check AWS credentials
echo "🔐 Checking AWS credentials..."
aws sts get-caller-identity >/dev/null 2>&1 || { echo "❌ AWS credentials not configured. Please run 'aws configure' first." >&2; exit 1; }

# Step 3: Generate session secret
echo "🔒 Generating session secret..."
SESSION_SECRET=$(openssl rand -base64 32)
echo "Session secret generated"

# Step 4: Create terraform.tfvars
echo "📝 Creating Terraform configuration..."
cat > $TERRAFORM_DIR/terraform.tfvars << EOF
aws_region = "$AWS_REGION"
session_secret = "$SESSION_SECRET"
environment = "production"
EOF

# Step 5: Initialize Terraform
echo "🏗️ Initializing Terraform..."
cd $TERRAFORM_DIR
terraform init

# Step 6: Plan Terraform deployment
echo "📋 Planning Terraform deployment..."
terraform plan -out=tfplan

# Step 7: Apply Terraform configuration
echo "🚀 Applying Terraform configuration..."
terraform apply tfplan

# Step 8: Get outputs
echo "📊 Getting Terraform outputs..."
ECR_REPOSITORY_URL=$(terraform output -raw ecr_repository_url)
ECS_CLUSTER_NAME=$(terraform output -raw ecs_cluster_name)
ALB_DNS_NAME=$(terraform output -raw alb_dns_name)

cd ../..

# Step 9: Build and push Docker image
echo "🐳 Building and pushing Docker image..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REPOSITORY_URL

docker build -t towerconnect .
docker tag towerconnect:latest $ECR_REPOSITORY_URL:latest
docker push $ECR_REPOSITORY_URL:latest

# Step 10: Update ECS service
echo "🔄 Updating ECS service..."
aws ecs update-service \
    --cluster $ECS_CLUSTER_NAME \
    --service towerconnect-service \
    --force-new-deployment \
    --region $AWS_REGION

# Step 11: Wait for deployment to complete
echo "⏳ Waiting for deployment to complete..."
aws ecs wait services-stable \
    --cluster $ECS_CLUSTER_NAME \
    --services towerconnect-service \
    --region $AWS_REGION

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Deployment Summary:"
echo "  - Application URL: http://$ALB_DNS_NAME"
echo "  - ECR Repository: $ECR_REPOSITORY_URL"
echo "  - ECS Cluster: $ECS_CLUSTER_NAME"
echo ""
echo "🔗 Next Steps:"
echo "  1. Access your application at: http://$ALB_DNS_NAME"
echo "  2. Login with admin credentials: admin / admin123"
echo "  3. Set up custom domain and SSL certificate"
echo "  4. Configure monitoring and alerting"
echo ""
echo "📊 Monitor your deployment:"
echo "  - ECS Console: https://console.aws.amazon.com/ecs/home?region=$AWS_REGION"
echo "  - CloudWatch Logs: https://console.aws.amazon.com/cloudwatch/home?region=$AWS_REGION#logsV2:log-groups/log-group/\$252Fecs\$252Ftowerconnect"
echo ""
echo "🧹 To clean up resources:"
echo "  cd $TERRAFORM_DIR && terraform destroy"

