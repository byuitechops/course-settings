# Child Module Title
### *Package Name*: child-module-title
### *Child Type*: <post/pre import>
### *Platform*: <online/pathway/campus/all> (Ask Zach or Daniel about this)
### *Required*: <Required/Recommended/Optional> (Ask Zach or Daniel about this)

This child module is built to be used by the Brigham Young University - Idaho D2L to Canvas Conversion Tool. It utilizes the standard `module.exports => (course, stepCallback)` signature and uses the Conversion Tool's standard logging functions. You can view extended documentation [Here](https://github.com/byuitechops/d2l-to-canvas-conversion-tool/tree/master/documentation).

## Purpose

This module sets the course settings to the ones specified for online courses.

## How to Install

```
npm install my-child-module
```

## Run Requirements

None.

## Options

None.

## Outputs

None.

## Process

The module uses the Canvas Courses API to change settings of each online course.

1. Updates the default course settings

## Log Categories

None.

## Requirements

This module enables/disables certain settings during the unpacking processs so that the user will not have to go into the settings and change it himself on every course.
These are the settings that it sets:
    Enables the "New Gradebook" Feature Option
    Time Zone: Mountain Time
    Term: Master Courses
    Language: English (US)
    License: Private (Copyrighted)
    Grading Scheme set to BYUI-Standard
    Visibility: Course
    Syllabus Visability: Institution
    Format: Online
    "Disable comments on announcements" unchecked