output "ec2_public_ip" {
  description = "Public IP address of the TabVault EC2 backend"
  value       = aws_instance.tabvault_backend.public_ip
}

output "healthcheck_url" {
  description = "Backend healthcheck URL"
  value       = "http://${aws_instance.tabvault_backend.public_ip}:8080/health"
}

output "websocket_endpoint" {
  description = "Backend WebSocket signaling endpoint"
  value       = "ws://${aws_instance.tabvault_backend.public_ip}:8080/ws"
}

output "amplify_frontend_url" {
  description = "Live AWS Amplify Frontend URL"
  value       = "https://main.d1rmonr4dy05xx.amplifyapp.com"
}
