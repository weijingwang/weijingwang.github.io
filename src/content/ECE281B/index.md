---
title: Kavli hall 3d reconstruction
description: Reconstruct using superpoint+superglue, colmap, gaussian splatting
image: gs_00161.webp
alt: Kavli hall
publishedDate: 20250516
lastUpdated: 20250810
hidden: false
---
Computer vision grad class at UCSB ECE 281B project 1 where we went though pipeline of making 3D construction of Kavli building given many pictures of it from different views.

## Step 1
Made manual keypoint matches by hand and computed homography and fundemental matrix.

## Step 2
Use superpoint+superglue to automate keypoint selection

## Step 3
Use colmap to make keypoint matches to make 3d point cloud.

## Step 4
Use gaussian splatting to render point cloud.

## Thoughts
Could have got better reconstruction if had more views (get entire building in one shot like aerial view) and also if utilized GPS metadata, or used depth map like depth pro.