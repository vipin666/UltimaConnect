variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "certificate_arn" {
  description = "ARN of the SSL certificate for HTTPS"
  type        = string
  default     = ""
}

variable "session_secret" {
  description = "Session secret for the application"
  type        = string
  sensitive   = true
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = ""
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

