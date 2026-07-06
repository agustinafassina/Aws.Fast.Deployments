# 🌍 `infrastructure/deployments/` — Terraform root (workspaces)

**Language / Idioma:** [English](#english) · [Español](#español)

<a id="english"></a>

Single Terraform root for **staging** and **production**. The active
**Terraform workspace** selects the target — no duplicate folders per environment.

## Workspaces

| Workspace | Use |
|-----------|-----|
| `staging` | Staging buckets + CloudFront + WAF |
| `production` | Production buckets + CloudFront + WAF |

## First-time setup

```bash
cd infrastructure/deployments

cp terraform.tfvars.example terraform.tfvars
cp staging.tfvars.example staging.tfvars
cp production.tfvars.example production.tfvars

terraform init
terraform workspace new staging
terraform workspace new production

terraform workspace select staging
terraform apply -var-file=staging.tfvars

terraform workspace select production
terraform apply -var-file=production.tfvars
```

## Day-to-day

```bash
terraform workspace select staging
terraform plan -var-file=staging.tfvars
terraform apply -var-file=staging.tfvars
```

## Files

| File | Purpose |
|------|---------|
| `locals.tf` | Naming (`tf-{env}-{project}-…`) + tags + `environment = terraform.workspace` |
| `terraform.tfvars` | Shared: `project_name`, `name_suffix`, `additional_tags`, `aws_region` |
| `staging.tfvars` | Sites + `waf_alarm_email` for **staging** |
| `production.tfvars` | Sites + `waf_alarm_email` for **production** |

One S3 backend stores **separate state per workspace** (`env:/staging/`, `env:/production/`). See `backend.tf`.

---

<a id="español"></a>

# 🌍 `infrastructure/deployments/` — Raíz Terraform (workspaces)

Raíz Terraform única para **staging** y **production**.

```bash
cd infrastructure/deployments
```

Ver comandos arriba. `staging.tfvars` y `production.tfvars` son git-ignored.
