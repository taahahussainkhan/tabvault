terraform {
  required_version = ">= 1.0.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# ==============================================================================
# 1. AWS S3 Encrypted Relay Bucket (24-Hour Auto-Delete Lifecycle + CORS)
# ==============================================================================
resource "aws_s3_bucket" "relay_drops" {
  bucket        = var.s3_bucket_name
  force_destroy = true

  tags = {
    Name = "TabVault Relay Drops"
    App  = "TabVault"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "relay_lifecycle" {
  bucket = aws_s3_bucket.relay_drops.id

  rule {
    id     = "AutoDeleteExpiredEncryptedDrops24Hours"
    status = "Enabled"

    filter {
      prefix = ""
    }

    expiration {
      days = 1
    }
  }
}

resource "aws_s3_bucket_cors_configuration" "relay_cors" {
  bucket = aws_s3_bucket.relay_drops.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "HEAD"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# ==============================================================================
# 2. AWS Amplify Web App Hosting (Global CDN + Auto CI/CD + Free SSL)
# ==============================================================================
resource "aws_amplify_app" "tabvault_web" {
  name        = "tabvault-web"
  description = "TabVault Web PWA Client"
  platform    = "WEB"

  custom_rule {
    source = "</^[^.]+$|\\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json)$)([^.]+$)/>"
    target = "/index.html"
    status = "200"
  }

  custom_rule {
    source = "/<*>"
    target = "/index.html"
    status = "404-200"
  }

  environment_variables = {
    NODE_ENV = "production"
  }
}

resource "aws_amplify_branch" "main" {
  app_id      = aws_amplify_app.tabvault_web.id
  branch_name = "main"

  enable_auto_build = true
  stage             = "PRODUCTION"
}

# ==============================================================================
# 3. AWS EC2 WebSocket Signaling & Relay Hub
# ==============================================================================
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_key_pair" "tabvault" {
  key_name   = "tabvault-key-mumbai"
  public_key = var.public_key
}

resource "aws_security_group" "tabvault_sg" {
  name        = "tabvault-backend-sg"
  description = "Allow inbound traffic for SSH, HTTP, HTTPS, and TabVault WebSocket relay"

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "TabVault Fastify WebSocket Relay"
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "tabvault-backend-sg"
  }
}

resource "aws_instance" "tabvault_backend" {
  ami                         = data.aws_ami.ubuntu.id
  instance_type               = var.instance_type
  key_name                    = aws_key_pair.tabvault.key_name
  vpc_security_group_ids      = [aws_security_group.tabvault_sg.id]
  associate_public_ip_address = true

  root_block_device {
    volume_size           = 20
    volume_type           = "gp3"
    delete_on_termination = true
  }

  user_data = <<-EOF
              #!/bin/bash
              set -e
              apt-get update
              apt-get install -y docker.io git
              systemctl enable docker
              systemctl start docker
              
              mkdir -p /opt/tabvault
              cd /opt/tabvault
              git clone https://github.com/taahahussainkhan/tabvault.git .
              docker build -t tabvault-server -f packages/server/Dockerfile .
              docker run -d --name tabvault-backend --restart always -p 8080:8080 \
                -e PORT=8080 \
                -e HOST=0.0.0.0 \
                -e AWS_REGION=${var.aws_region} \
                -e S3_BUCKET_NAME=${var.s3_bucket_name} \
                -e MONGODB_URI="${var.mongodb_uri}" \
                tabvault-server
              EOF

  tags = {
    Name = "tabvault-signaling-backend"
    App  = "TabVault"
  }
}
