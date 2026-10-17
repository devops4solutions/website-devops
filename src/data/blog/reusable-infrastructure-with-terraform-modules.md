---
title: Reusable Infrastructure with Terraform Modules
description: Learn how to build reusable Terraform modules to eliminate duplicate code and provision AWS infrastructure consistently across environments.
pubDate: 2020-11-17
author: Nidhi Gupta
category: Terraform
tags:
  - Terraform
  - AWS
  - Infrastructure as Code
  - DevOps
  - Modules
image: /images/blog/terraform-modules.webp
imageAlt: Terraform modules used to provision reusable AWS infrastructure
featured: false
draft: false
readingTime: 7 min
---

> **Watch the companion YouTube video** for this article.

For more DevOps and Cloud Architecture content, visit **https://devops4solutions.com**.

# Reusable Infrastructure with Terraform Modules

Infrastructure for development, staging, and production environments is usually very similar, with only a few configuration differences. Unfortunately, many teams duplicate Terraform code for every environment, making maintenance difficult.

A better approach is to build **reusable Terraform modules**.

Terraform modules allow you to write infrastructure code once and reuse it across multiple environments, reducing duplication while improving consistency and maintainability.

---

## What are Terraform Modules?

Think of Terraform modules like **functions in a programming language**.

Instead of rewriting the same infrastructure multiple times, you place the infrastructure inside a module and call it wherever it is needed by passing different input variables.

Benefits include:

- Eliminates copy and paste
- Improves code reuse
- Easier maintenance
- Consistent infrastructure deployments
- Simplifies environment management

For example, both your **Development** and **Production** environments can use exactly the same VPC module while only changing the CIDR ranges or tags.

---

## Example Architecture

In this example we'll build a simple AWS network consisting of:

- VPC
- Public Subnet

using reusable Terraform modules.

---

## Prerequisites

Before getting started, ensure you have:

- Terraform installed
- AWS CLI configured
- AWS credentials configured
- Git installed

Clone the sample repository before starting.

---

## Project Structure

```text
terraform-example/
│
├── dev/
│   └── main.tf
│
└── modules/
    ├── vpc/
    │   ├── network.tf
    │   └── variables.tf
    │
    └── subnet/
        ├── subnet.tf
        └── variables.tf
```

Each module contains everything required for one logical infrastructure component.

---

## Creating the VPC Module

```terraform
resource "aws_vpc" "terraform_vpc" {

  cidr_block = var.vpc_full_cidr

  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "terraform_vpc"
  }
}
```

The following settings enable internal DNS resolution inside the VPC.

```terraform
enable_dns_support = true
enable_dns_hostnames = true
```

---

## Exporting Outputs

The VPC ID is required by other modules.

```terraform
output "vpc_id" {
  value = aws_vpc.terraform_vpc.id
}
```

Outputs allow one Terraform module to expose values that can be consumed by another module.

---

## Creating the Subnet Module

Declare the VPC ID as an input variable.

```terraform
variable "vpc_id" {}
```

Create the subnet.

```terraform
resource "aws_subnet" "public_aza" {

  vpc_id     = var.vpc_id
  cidr_block = var.subnet_public_aza_cidr

  tags = {
    Name = "PublicSubnetAZA"
  }
}
```

Notice that the subnet module doesn't create its own VPC—it simply receives the VPC ID from the VPC module.

---

## Calling the Modules

Inside **main.tf**, reference both modules.

```terraform
provider "aws" {
  region = var.region
}

module "vpc" {
  source = "./modules/vpc"
}

module "subnet" {
  source = "./modules/subnet"

  vpc_id = module.vpc.vpc_id
}
```

The subnet module consumes the VPC ID exported by the VPC module.

---

## Configuring Remote State

Store Terraform state remotely in Amazon S3 and use DynamoDB for state locking.

```terraform
terraform {

  backend "s3" {

    bucket         = "terraform-remote-state-devops4solutions-bucket"
    dynamodb_table = "terraform-state-lock-dynamo-devops4solutions"

    region = "us-east-2"
    key    = "terraform.tfstate"
  }
}
```

Using remote state prevents multiple users from overwriting each other's changes and provides a centralized location for Terraform state.

---

## Deploy the Infrastructure

Clone the repository.

```bash
git clone https://github.com/devops4solutions/terraform-example-aws.git
```

Navigate to the project.

```bash
cd vpc-subnet-example
```

Initialize Terraform.

```bash
terraform init
```

Review the execution plan.

```bash
terraform plan
```

Deploy the infrastructure.

```bash
terraform apply
```

Once complete, verify the newly created VPC and subnet in the AWS Console.

---

## Benefits of Terraform Modules

Using Terraform Modules provides several advantages:

- Write infrastructure once and reuse it everywhere
- Reduce duplicate code
- Standardize deployments
- Improve maintainability
- Scale infrastructure more efficiently
- Simplify onboarding for new engineers

Modules are one of the most important Terraform concepts and are heavily used in enterprise infrastructure.

---

## Conclusion

Reusable Terraform Modules make Infrastructure as Code significantly easier to manage.
