In-House Conference Management System
Software Requirements Specification (SRS)

Version – 2 (Updated User Model)

Revision History
Date	Description	Author	Comments
23/01/2026	Version 1	Team-L	Initial SRS
09/02/2026	Version 2	Team-L	Updated user roles: SuperAdmin, Admin, SubAdmin
1. Introduction

This document describes the Software Requirements Specification (SRS) for the In-House Conference Management System. This SRS defines the complete behavior, features, constraints, and user interactions of the system.

The document specifies what the system should do, not how it will be implemented. It serves as a reference for students, instructors, and developers involved in the project.

1.1 Purpose

The purpose of this SRS is to clearly define all functional and non-functional requirements of the system after introducing a three-level user role model:

SuperAdmin

Admin

SubAdmin

This document will guide:

System design

Implementation

Testing

Validation

1.2 Scope

The In-House Conference Management System is a web-based and desktop application used to manage institutional events such as conferences, workshops, and seminars.

The system will:

Allow SuperAdmins to manage Admin and SubAdmin users

Allow Admins to create and manage events

Allow Admins and SubAdmins to manage events they have access to

Allow CSV import of participant data

Generate and email QR codes

Provide QR-based attendance marking

Generate certificates and receipts

Send notifications to participants

Export participant and attendance data

The system will not:

Provide participant login

Allow public event browsing

Support online payments

Support self-registration

Provide dynamic form creation

Participants interact with the system only through email communication.

1.3 Definitions, Acronyms, and Abbreviations
Term	Description
SRS	Software Requirements Specification
SuperAdmin	User who manages Admin and SubAdmin accounts
Admin	User who can create and manage events
SubAdmin	User who can manage assigned events but cannot create events
Event	Conference, workshop, or seminar
QR Code	Unique code assigned to each participant
UI	User Interface
DB	Database
1.4 References

IEEE Std. 830-1984 – Software Requirements Specification

React Documentation

MongoDB Documentation

Electron Documentation

1.5 Overview

This SRS is organized as:

Section 1 – Introduction

Section 2 – General Description

Section 3 – Specific Requirements

Appendices – Supporting information

2. General Description
2.1 Product Perspective

The system is a new standalone application developed for internal academic use. It replaces manual processes such as:

Manual attendance

Manual certificate distribution

Manual receipt handling

The system consists of:

Web application (React + Express)

Desktop application (Electron wrapper)

MongoDB database

Email service integration

2.2 Product Functions

The system provides the following major functions:

SuperAdmin management of Admin and SubAdmin users

Event creation by Admin users

Event assignment to Admins and SubAdmins

CSV import of participants

QR code generation and email delivery

QR-based attendance marking

Duplicate attendance prevention

Certificate generation and distribution

Receipt generation and email

Notification system

Export of data

2.3 User Characteristics

There are three types of users in the system:

1. SuperAdmin

Creates, edits, and deletes Admin and SubAdmin accounts

Resets passwords

Does not manage events

Requires basic computer knowledge

2. Admin

Creates events

Assigns Admins or SubAdmins to events

Manages participants

Sends QR codes, certificates, notifications

Marks attendance

Requires average computer skills

3. SubAdmin

Cannot create events

Can manage only assigned events

Can scan QR codes and mark attendance

Can send certificates and notifications for assigned events

Requires average computer skills

Note: Participants are not system users and do not log in.

2.4 General Constraints

Academic project time limits

Use of React, Express, MongoDB, Electron

Dependence on email services

Internet availability

Limited server resources

2.5 Assumptions and Dependencies

Users have internet access

Email services are reliable

Hosting server is operational

Admins provide valid CSV data

3. Specific Requirements
3.1 External Interface Requirements
3.1.1 User Interfaces

Web-based admin dashboard

Desktop interface via Electron

Role-based UI access:

SuperAdmin dashboard

Admin dashboard

SubAdmin dashboard

3.2 Functional Requirements
3.2.1 User Management (SuperAdmin Only)

SuperAdmin shall create Admin and SubAdmin accounts

SuperAdmin shall edit user details

SuperAdmin shall delete user accounts

SuperAdmin shall reset passwords

3.2.2 Event Creation and Management
Introduction

Only Admins can create events.

Functional Requirements

Admin shall create events

Admin shall assign Admins or SubAdmins to events

SubAdmin shall only access assigned events

Admin and SubAdmin shall update event details

3.2.3 CSV Import of Participants

Admin and SubAdmin shall import CSV files for assigned events

System shall validate CSV format

System shall store participant data

3.2.4 QR Code Generation and Email

System shall generate a unique QR code per participant

Admin and SubAdmin can trigger QR email for assigned events

3.2.5 QR-Based Attendance

Admin and SubAdmin shall scan QR codes

System shall mark attendance on first scan

Duplicate scans shall not modify attendance

Participant details shall be displayed

3.2.6 Certificate Generation and Distribution

Admin and SubAdmin shall select certificate templates

Certificates shall be generated automatically

Certificates shall be emailed to eligible participants

3.2.7 Notification System

Admin and SubAdmin shall send notifications

Notifications can target:

All participants

Selected participants

3.3 Classes / Objects
3.3.1 User

Attributes

userId

name

email

role (SuperAdmin | Admin | SubAdmin)

Functions

manageUsers() [SuperAdmin only]

createEvent() [Admin only]

manageEvent()

sendNotifications()

3.3.2 Event

Attributes

eventId

name

date

description

assignedUsers[]

participants[]

attendanceList

3.3.3 Participant

Attributes

participantId

name

email

qrCode

attended

3.4 Non-Functional Requirements
Security

Role-based access control

Encrypted passwords

Restricted event access

Performance

95% responses within 2 seconds

Reliability

Daily backups

No data loss on minor failure

3.5 Inverse Requirements

SubAdmin shall not create events

Unauthorized users shall not access events

Attendance shall not be marked using invalid QR codes

3.6 Design Constraints

React frontend

Express + MongoDB backend

Electron desktop app

External email APIs

3.7 Logical Database Requirements

Users collection with role field

Events collection with assigned users

Participants linked to events

Attendance stored as boolean

Duplicate attendance prevention

3.8 Other Requirements

CSV export support