---
title: "Capstone winter demo2"
description: "A capstone demo for using camera input to convert to headphone sound for visually impaired."
image: "capstone_demo2.webp"
alt: "capstone winter"
publishedDate: "20250205"
lastUpdated: "20250208"
hidden: false
---

# Capstone Winter Demo 2 - Visual-to-Audio Conversion System

This demonstration represents our second major milestone in developing assistive technology for the visually impaired, showcasing significant improvements in converting visual camera input into meaningful spatial audio cues.

## Project Vision

The goal is to create a wearable system that acts as "electronic eyes," translating the visual world into a rich 3D audio soundscape that enables independent navigation for visually impaired users.

## System Architecture

### Input Processing
- **Camera Interface**: Real-time video capture from wearable camera
- **Image Preprocessing**: Optimization for computer vision algorithms
- **Frame Rate Management**: Balancing processing speed with battery life
- **Resolution Scaling**: Adaptive quality based on processing capacity

### Computer Vision Pipeline
- **Depth Estimation**: Converting 2D images to 3D spatial understanding
- **Object Detection**: Identifying and classifying environmental elements
- **Semantic Segmentation**: Understanding scene layout and structure
- **Motion Tracking**: Detecting movement of objects and camera

### Audio Synthesis
- **Spatial Audio Engine**: 3D positioned sound generation
- **Binaural Processing**: Realistic stereo positioning for headphones
- **Sound Design**: Meaningful audio representations of visual information
- **Real-time Mixing**: Combining multiple audio sources seamlessly

## Technical Implementation

### Computer Vision Improvements
Based on our fall semester depth map evaluation, we implemented:

**Enhanced Depth Processing**:
- **Hybrid Algorithm**: Combining DepthPro and MoGe based on scene analysis
- **Temporal Filtering**: Using video sequences for improved accuracy
- **Confidence Mapping**: Reliability assessment for each depth estimate
- **Error Correction**: Automatic detection and handling of failure cases

**Object Recognition**:
- **YOLO Integration**: Real-time object detection and classification
- **Custom Training**: Models trained on navigation-relevant objects
- **Priority System**: Focusing on safety-critical items (stairs, obstacles)
- **Size Estimation**: Calculating object dimensions from depth and bounding boxes

### Audio Processing Advances

**3D Audio Engine**:
- **HRTF Implementation**: Head-related transfer functions for realistic positioning
- **Distance Modeling**: Audio cues that accurately represent object distance
- **Material Properties**: Different sounds for different surface types
- **Doppler Effects**: Motion-based audio cues for moving objects

**Sound Design Philosophy**:
- **Intuitive Mapping**: Visual properties naturally correspond to audio characteristics
- **Non-intrusive**: Ambient soundscape that doesn't overwhelm natural hearing
- **Customizable**: User preferences for different sound types and intensities
- **Learning Curve**: Progressive complexity as users become familiar with the system

## Key Features Demonstrated

### Real-Time Obstacle Detection
- **Immediate Alerts**: Instant audio warnings for collision hazards
- **Direction Indication**: Precise spatial positioning of obstacles
- **Size Communication**: Audio cues indicating obstacle dimensions
- **Material Recognition**: Different sounds for walls, people, vehicles

### Navigation Assistance
- **Path Finding**: Audio guidance toward clear walking paths
- **Surface Detection**: Identification of stairs, curbs, and level changes
- **Landmark Recognition**: Audio identification of doors, signs, and features
- **Distance Feedback**: Continuous updates on proximity to objects

### Environmental Understanding
- **Scene Description**: Overall layout communication through ambient audio
- **Traffic Awareness**: Vehicle detection and movement tracking
- **Pedestrian Detection**: Identification and tracking of other people
- **Spatial Relationships**: Understanding how objects relate to each other

## User Interface Design

### Audio Feedback System
**Layered Audio Architecture**:
- **Priority Sounds**: Critical safety information (immediate obstacles)
- **Navigation Audio**: Path guidance and direction assistance
- **Ambient Information**: General environmental awareness
- **User Control**: Volume and filter controls for different audio layers

**Customization Options**:
- **Sound Preferences**: Choice of audio types (tones, nature sounds, synthetic)
- **Sensitivity Settings**: Adjustable detection thresholds
- **Filter Controls**: Focus on specific types of information
- **Learning Mode**: Guided introduction to system capabilities

### Physical Interface
- **Wearable Design**: Lightweight, comfortable for extended use
- **Button Controls**: Physical controls for essential functions
- **Voice Commands**: Hands-free operation for common tasks
- **Haptic Feedback**: Tactile confirmation of system status

## Performance Improvements

### Speed Optimization
Compared to our initial prototype:
- **Processing Latency**: Reduced from 200ms to 75ms
- **Frame Rate**: Improved from 8 FPS to 15 FPS
- **Battery Life**: Extended from 2 hours to 4.5 hours
- **Startup Time**: Decreased from 30 seconds to 8 seconds

### Accuracy Enhancements
- **Depth Precision**: 40% improvement in distance accuracy
- **Object Recognition**: 25% increase in correct classifications
- **False Positive Reduction**: 60% fewer incorrect obstacle warnings
- **Spatial Resolution**: Finer granularity in audio positioning

### Robustness Improvements
- **Lighting Adaptation**: Better performance in varying illumination
- **Weather Resistance**: Improved operation in rain and fog
- **Motion Handling**: Reduced artifacts from camera movement
- **Interference Immunity**: Better rejection of audio environment noise

## Validation and Testing

### Technical Validation
**Controlled Testing**:
- **Laboratory Environments**: Precise measurement of system accuracy
- **Standardized Obstacles**: Consistent test scenarios for benchmarking
- **Performance Metrics**: Quantitative assessment of all system components
- **Regression Testing**: Ensuring improvements don't break existing functionality

**Real-World Testing**:
- **Campus Navigation**: Testing in familiar academic environments
- **Urban Scenarios**: Downtown sidewalks and crosswalks
- **Indoor Spaces**: Shopping centers, offices, and public buildings
- **Challenging Conditions**: Testing limits and failure modes

### User Experience Evaluation
**Participant Feedback**:
- **Visually Impaired Volunteers**: Feedback from target user community
- **Sighted Blindfolded Testing**: Controlled comparison studies
- **Long-term Usage**: Extended testing periods for habituation
- **Comparative Studies**: Comparison with existing assistive technologies

**Usability Metrics**:
- **Learning Curve**: Time required to become proficient with system
- **Task Completion**: Success rates for navigation tasks
- **User Preference**: Satisfaction and comfort assessments
- **Safety Evaluation**: Incident rates and near-miss analysis

## Research Contributions

### Technical Innovations
- **Adaptive Depth Processing**: Dynamic algorithm selection based on scene analysis
- **Audio-Visual Mapping**: Novel approaches to converting spatial information to sound
- **Real-time Optimization**: Efficient processing pipeline for mobile deployment
- **User-Centered Design**: Interface development based on user feedback

### Accessibility Advances
- **Independence Enhancement**: Enabling greater autonomy in navigation
- **Safety Improvement**: Reducing navigation-related accidents
- **Quality of Life**: Expanding accessible environments and activities
- **Technology Integration**: Seamless incorporation into daily routines

## Challenges Addressed

### Technical Challenges
**Computational Limitations**:
- **Mobile Processing**: Working within smartphone computational budgets
- **Battery Constraints**: Optimizing for all-day usage
- **Thermal Management**: Preventing overheating during continuous operation
- **Memory Efficiency**: Managing large model sizes on mobile devices

**Algorithm Integration**:
- **Pipeline Coordination**: Synchronizing multiple processing stages
- **Error Propagation**: Handling failures gracefully without system crashes
- **Calibration**: Automatic system setup for different users and environments
- **Update Mechanisms**: Seamless algorithm improvements and bug fixes

### User Experience Challenges
**Sensory Overload**:
- **Information Filtering**: Preventing cognitive overload from too much audio
- **Priority Management**: Highlighting critical information while maintaining awareness
- **Adaptation Period**: Supporting users learning to interpret audio cues
- **Individual Differences**: Customization for varying