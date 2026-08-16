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
# 2. IAM Role & Permissions for Serverless Lambda
# ==============================================================================
resource "aws_iam_role" "lambda_exec" {
  name = "tabvault-serverless-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "lambda_policy" {
  name = "tabvault-lambda-permissions"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject"
        ]
        Resource = "${aws_s3_bucket.relay_drops.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "execute-api:ManageConnections"
        ]
        Resource = "arn:aws:execute-api:*:*:*"
      }
    ]
  })
}

# ==============================================================================
# 3. AWS Lambda Function (Node.js 20 ESM)
# ==============================================================================
resource "aws_lambda_function" "tabvault_backend" {
  function_name    = "tabvault-backend-lambda"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "lambda.handler"
  runtime          = "nodejs20.x"
  filename         = "${path.module}/../packages/server/dist/lambda.zip"
  source_code_hash = filebase64sha256("${path.module}/../packages/server/dist/lambda.zip")
  timeout          = 30
  memory_size      = 256

  environment {
    variables = {
      NODE_ENV       = "production"
      S3_BUCKET_NAME = var.s3_bucket_name
      MONGODB_URI    = var.mongodb_uri
    }
  }

  tags = {
    Name = "tabvault-backend-lambda"
    App  = "TabVault"
  }
}

# ==============================================================================
# 4. API Gateway WebSocket API (Signaling & Presence Hub)
# ==============================================================================
resource "aws_apigatewayv2_api" "ws_api" {
  name                       = "tabvault-websocket-api"
  protocol_type              = "WEBSOCKET"
  route_selection_expression = "$request.body.action"
}

resource "aws_apigatewayv2_integration" "ws_integration" {
  api_id           = aws_apigatewayv2_api.ws_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.tabvault_backend.invoke_arn
}

resource "aws_apigatewayv2_route" "ws_connect" {
  api_id    = aws_apigatewayv2_api.ws_api.id
  route_key = "$connect"
  target    = "integrations/${aws_apigatewayv2_integration.ws_integration.id}"
}

resource "aws_apigatewayv2_route" "ws_disconnect" {
  api_id    = aws_apigatewayv2_api.ws_api.id
  route_key = "$disconnect"
  target    = "integrations/${aws_apigatewayv2_integration.ws_integration.id}"
}

resource "aws_apigatewayv2_route" "ws_default" {
  api_id    = aws_apigatewayv2_api.ws_api.id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.ws_integration.id}"
}

resource "aws_apigatewayv2_stage" "ws_stage" {
  api_id      = aws_apigatewayv2_api.ws_api.id
  name        = "prod"
  auto_deploy = true
}

resource "aws_lambda_permission" "ws_permission" {
  statement_id  = "AllowAPIGatewayWSInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.tabvault_backend.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.ws_api.execution_arn}/*/*"
}

# ==============================================================================
# 5. API Gateway HTTP/REST API (Presigned S3 URLs & Healthcheck)
# ==============================================================================
resource "aws_apigatewayv2_api" "http_api" {
  name          = "tabvault-http-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["GET", "POST", "OPTIONS"]
    allow_headers = ["Content-Type", "Authorization"]
    max_age       = 3000
  }
}

resource "aws_apigatewayv2_integration" "http_integration" {
  api_id           = aws_apigatewayv2_api.http_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.tabvault_backend.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "http_default" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.http_integration.id}"
}

resource "aws_apigatewayv2_stage" "http_stage" {
  api_id      = aws_apigatewayv2_api.http_api.id
  name        = "$default"
  auto_deploy = true
}

resource "aws_lambda_permission" "http_permission" {
  statement_id  = "AllowAPIGatewayHTTPInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.tabvault_backend.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

# ==============================================================================
# 6. AWS Amplify Web App Hosting (Global CDN + Auto CI/CD)
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
