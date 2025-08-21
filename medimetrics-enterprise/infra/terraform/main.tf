terraform {
  required_version = ">= 1.5.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
  }
  
  backend "s3" {
    bucket         = "medimetrics-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}

# VPC Configuration
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  version = "5.0.0"

  name = "medimetrics-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["us-east-1a", "us-east-1b", "us-east-1c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

  enable_nat_gateway = true
  enable_vpn_gateway = true
  enable_dns_hostnames = true
  enable_dns_support = true

  tags = {
    Environment = var.environment
    Application = "medimetrics"
    Compliance  = "HIPAA"
  }
}

# EKS Cluster
module "eks" {
  source = "terraform-aws-modules/eks/aws"
  version = "19.15.3"

  cluster_name    = "medimetrics-${var.environment}"
  cluster_version = "1.28"

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  enable_irsa = true

  eks_managed_node_group_defaults = {
    disk_size      = 100
    instance_types = ["t3.large"]
  }

  eks_managed_node_groups = {
    general = {
      desired_size = 3
      min_size     = 2
      max_size     = 10

      instance_types = ["t3.xlarge"]
      
      k8s_labels = {
        Environment = var.environment
        NodeType    = "general"
      }
    }

    gpu = {
      desired_size = 1
      min_size     = 0
      max_size     = 3

      instance_types = ["g4dn.xlarge"]
      
      k8s_labels = {
        Environment = var.environment
        NodeType    = "gpu"
      }
      
      taints = [{
        key    = "gpu"
        value  = "true"
        effect = "NO_SCHEDULE"
      }]
    }
  }
}

# RDS PostgreSQL
module "rds" {
  source = "terraform-aws-modules/rds/aws"

  identifier = "medimetrics-db-${var.environment}"

  engine            = "postgres"
  engine_version    = "16.1"
  instance_class    = var.db_instance_class
  allocated_storage = 100
  storage_encrypted = true
  kms_key_id       = aws_kms_key.rds.arn

  db_name  = "medimetrics"
  username = "dbadmin"
  port     = "5432"

  vpc_security_group_ids = [aws_security_group.rds.id]
  
  maintenance_window = "Mon:00:00-Mon:03:00"
  backup_window      = "03:00-06:00"
  
  backup_retention_period = 30
  skip_final_snapshot    = false
  deletion_protection    = true

  enabled_cloudwatch_logs_exports = ["postgresql"]
  
  create_db_subnet_group = true
  subnet_ids            = module.vpc.private_subnets

  family = "postgres16"
  major_engine_version = "16"

  performance_insights_enabled = true
  performance_insights_retention_period = 7

  tags = {
    Environment = var.environment
    Compliance  = "HIPAA"
  }
}

# ElastiCache Redis
resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "medimetrics-redis-${var.environment}"
  engine              = "redis"
  node_type           = "cache.r7g.large"
  num_cache_nodes     = 2
  parameter_group_name = "default.redis7"
  engine_version      = "7.0"
  port                = 6379
  
  subnet_group_name = aws_elasticache_subnet_group.redis.name
  security_group_ids = [aws_security_group.redis.id]
  
  snapshot_retention_limit = 7
  snapshot_window         = "03:00-05:00"
  
  tags = {
    Environment = var.environment
  }
}

# S3 Buckets
resource "aws_s3_bucket" "medical_images" {
  bucket = "medimetrics-images-${var.environment}"

  tags = {
    Environment = var.environment
    Compliance  = "HIPAA"
  }
}

resource "aws_s3_bucket_versioning" "medical_images" {
  bucket = aws_s3_bucket.medical_images.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "medical_images" {
  bucket = aws_s3_bucket.medical_images.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

# KMS Keys
resource "aws_kms_key" "master" {
  description             = "MediMetrics Master KMS Key"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = {
    Environment = var.environment
    Compliance  = "HIPAA"
  }
}

resource "aws_kms_key" "rds" {
  description             = "MediMetrics RDS Encryption Key"
  deletion_window_in_days = 30
  enable_key_rotation     = true
}

resource "aws_kms_key" "s3" {
  description             = "MediMetrics S3 Encryption Key"
  deletion_window_in_days = 30
  enable_key_rotation     = true
}

# Security Groups
resource "aws_security_group" "rds" {
  name_prefix = "medimetrics-rds-"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [module.eks.cluster_security_group_id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Environment = var.environment
  }
}

resource "aws_security_group" "redis" {
  name_prefix = "medimetrics-redis-"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [module.eks.cluster_security_group_id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Environment = var.environment
  }
}

resource "aws_elasticache_subnet_group" "redis" {
  name       = "medimetrics-redis-subnet-${var.environment}"
  subnet_ids = module.vpc.private_subnets
}

# Variables
variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.r6g.large"
}

# Outputs
output "eks_cluster_endpoint" {
  value = module.eks.cluster_endpoint
}

output "rds_endpoint" {
  value     = module.rds.db_instance_endpoint
  sensitive = true
}

output "redis_endpoint" {
  value     = aws_elasticache_cluster.redis.cache_nodes[0].address
  sensitive = true
}

output "s3_bucket_name" {
  value = aws_s3_bucket.medical_images.id
}