terraform {
  backend "s3" {
    bucket         = "tf-production-state"
    region         = "us-east-1"
    encrypt        = true
  }
}
