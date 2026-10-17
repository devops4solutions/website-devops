---
title: "Understanding Kubernetes Storage: Volumes, PVs, PVCs, and AWS Storage Options"
description: A practical guide to Kubernetes storage concepts including Volumes, Persistent Volumes, Persistent Volume Claims, Storage Classes, and AWS storage options like EBS and EFS.
pubDate: 2026-07-12
author: Nidhi Gupta
category: Architecture
tags:
  - Kubernetes
  - AWS
  - Infrastructure as Code
---

Kubernetes storage is a crucial aspect of running stateful applications in a cluster. In this blog, we will cover key storage concepts such as Volumes, Storage Classes, Persistent Volumes (PVs), Persistent Volume Claims (PVCs), provisioning types, retention policies, and AWS storage options like EBS and EFS.
1. Kubernetes Storage Fundamentals
Volumes in Kubernetes
Kubernetes Volumes provide storage to containers running in a Pod. Unlike ephemeral container storage, Kubernetes Volumes persist as long as the Pod is running.
Types of Volumes:
emptyDir - Temporary storage that gets erased when the Pod is deleted.
hostPath - Mounts a directory from the node's filesystem.
configMap/Secret - Used for storing configuration data securely.
Persistent Volumes (PVs) - More advanced storage that can be dynamically or statically provisioned.

2. Persistent Storage in Kubernetes
Persistent Volumes (PVs) and Persistent Volume Claims (PVCs)
Persistent Volumes (PVs): Cluster-wide resources provisioned by administrators or dynamically by Storage Classes.
Persistent Volume Claims (PVCs): Requests for storage by applications, which are bound to PVs.

Example PVC YAML:
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: my-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
  storageClassName: ebs-sc
3. Storage Classes and Provisioning
Storage Classes
A StorageClass defines how storage is provisioned dynamically. It allows users to specify different storage types and policies.
Example StorageClass YAML:
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: ebs-sc
  annotations:
    storageclass.kubernetes.io/is-default-class: "true"
provisioner: ebs.csi.aws.com
allowVolumeExpansion: true
volumeBindingMode: WaitForFirstConsumer
reclaimPolicy: Delete
parameters:
  type: gp3
  fsType: ext4
  encrypted: "true"
Static vs. Dynamic Provisioning
Static Provisioning: Admins create PVs manually and bind them to PVCs.
Dynamic Provisioning: Kubernetes automatically provisions storage when a PVC is created.

4. Retention Policies in Kubernetes Storage
Delete: The PV is deleted when the PVC is deleted.
Retain: The PV remains even if the PVC is deleted, requiring manual cleanup.
Recycle (deprecated): The volume is scrubbed and made available again.

5. AWS Storage Options for Kubernetes
Amazon EBS (Elastic Block Store)
Best for block storage that needs high performance.

Used with stateful applications like databases.

Requires PV, PVC, and StorageClass configurations.

Amazon EFS (Elastic File System)
A fully managed NFS-based file system.

Supports multiple Pods accessing the same volume.

Ideal for shared storage use cases.

Example EFS StorageClass YAML:
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: efs-sc
provisioner: efs.csi.aws.com
parameters:
  fileSystemId: fs-12345678
  provisioningMode: efs-ap
  directoryPerms: "777"
Conclusion
Kubernetes provides powerful storage options for running stateful applications. Understanding volumes, PVs, PVCs, Storage Classes, and AWS storage solutions like EBS and EFS ensures that your applications have the persistent storage they need.
