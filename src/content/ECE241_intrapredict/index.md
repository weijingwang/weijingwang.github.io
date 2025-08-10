---
title: H.264 intraprediction modes
description: Project for ECE241 to implement H.264 intraprediction and see how different modes affect prediction
image: ECE241_intrapredict.webp
alt: ECE241 project
publishedDate: 20250312
lastUpdated: 20250810
hidden: false
---

This was my final project for UCSB grad class ECE241 multimedia compression. It is about analyzing the effect of the modes of H.264. They are basically colored puzzle pieces that you can use to build your video frame and there are 8 of these modes (at least in luma 4x4 blocks). What would happen if I only used a subset of these modes?

## Result 1
The modes were pretty uniformly distributed so using less modes just made the prediction worse but not by much. 

## Result 2
Your mode is 4x4 is like a paintbrush. So if you use a fat paintbrush to paint fine details, you will do really bad. Same for modes.