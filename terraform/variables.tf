variable "aws_region" {
  description = "AWS deployment region"
  type        = string
  default     = "ap-south-1"
}

variable "instance_type" {
  description = "EC2 instance type (Free Tier eligible)"
  type        = string
  default     = "t3.micro"
}

variable "mongodb_uri" {
  description = "MongoDB Atlas connection URI"
  type        = string
  default     = "mongodb+srv://taaha128_db_user:fc3pX5oIv62WbWjq@cluster0.sm7xsk2.mongodb.net/tabvault?retryWrites=true&w=majority&appName=Cluster0"
}

variable "s3_bucket_name" {
  description = "S3 bucket for temporary encrypted drops"
  type        = string
  default     = "tabvault-relay-drops-474665693065"
}

variable "public_key" {
  description = "SSH public key for EC2 key pair"
  type        = string
  default     = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAINtob5aHHO2XZXbS4y3gNcZr5Yzd4BEj21qtNK13IJSR taahahussainkhan"
}
