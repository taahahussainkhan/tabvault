output "websocket_endpoint" {
  description = "Live AWS API Gateway WebSocket URL for WebRTC signaling and clipboard sync"
  value       = aws_apigatewayv2_stage.ws_stage.invoke_url
}

output "http_api_endpoint" {
  description = "Live AWS API Gateway HTTP/REST API base URL"
  value       = aws_apigatewayv2_stage.http_stage.invoke_url
}

output "healthcheck_url" {
  description = "Live Serverless Lambda Healthcheck URL"
  value       = "${aws_apigatewayv2_stage.http_stage.invoke_url}/health"
}

output "amplify_frontend_url" {
  description = "Live AWS Amplify Web Application URL"
  value       = "https://main.d1rmonr4dy05xx.amplifyapp.com"
}

output "s3_bucket_name" {
  description = "S3 Encrypted Relay Bucket Name"
  value       = aws_s3_bucket.relay_drops.id
}
