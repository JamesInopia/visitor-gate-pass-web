# [Working Title] (visitor-gate-pass)

## Project Overview

### Statement of the Problem

Filinvest security staff currently lack a reliable system to track visitor entry. Without proper monitoring, guests can potentially access restricted zones, creating blind spots and compromising the building's security.

### Proposed Solution

Our proposed solution is a digital visitor gate-pass system. Admins grant building access to a visitor, who then receives a unique code. The Filinvest staff then scans the code at the entrance to verify the pass and view the visitor's details, including purpose of visit, ID credentials, phone number, and the admin who authorized them. Once the pass expires, sensitive user information is permanently deleted. Only a minimal log is kept for accountability.

### Project Goal

Develop a visitor gate pass system that provides security and administrators with a fast, reliable, and accountable way to track entry, while safeguarding guest privacy through strict data retention limits.

## System Overview

### Core Features

| Feature                   | Description                                                                                                                                                                                                                  |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Role-based Accounts       | All users share one Users table with a role of visitor, tenant or admin. Each role sees only the screens and data it needs.                                                                                                  |
| Visitor Access Request    | A visitor enters the tenant's room number and full name, their own contact details, the purpose of the visit and a photo of their ID. The system matches the room number and name to a tenant and sends the request to them. |
| Tenant Approval or Denial | The tenant gets the request, sees who is asking and why, and allows or denies it. This keeps the decision with the person being visited.                                                                                     |
| Gatepass Generation       | An approved request creates a gatepass with a unique code. The tenant can set the expiry date, which defaults to 24 hours.                                                                                                   |
| Admin Verification        | The admin scans or enters the gatepass code to confirm it's valid. While the pass is active, the admin can view the visitor's details and ID image to check they match the person at the gate.                               |
| Entry and Exit Logging    | Each scan is recorded with the time, the direction and the admin who handled it. This is where the first entry and last exit times come from.                                                                                |
| Auto Expiry and Archiving | After the expiry time, the system copies the allowed details into the archive, then deletes the gatepass, the request, the entry logs and the visitor's personal data.                                                       |
| Privacy by Design         | ID images and contact details only exist while the visit is active. The archive holds just the visitor's name, purpose, unit visited, host, authorizing admin, and first entry and last exit times.                          |

### User Requirements

| User      | Requirement                                                                                                                                                                                                                                              |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| All Users | • Must sign in with their own account.<br>• Should only see data relevant to their role.                                                                                                                                                                 |
| Visitor   | • Can request a gatepass without needing to know anything beyond the tenant's room number and full name.<br>• Can see whether the request is pending, approved or denied.<br>• Can show a gatepass code on their phone at the entrance.                  |
| Tenant    | • Gets notified when someone requests to visit them.<br>• Can see the visitor's name, purpose of visit and contact details before deciding.<br>• Can choose the pass duration, with 24 hours as the default.<br>• Can cancel a pass before it expires.   |
| Admin     | • Can quickly validate a code and tell whether it is active, expired or revoked.<br>• Can view the visitor's ID image only while the gatepass is valid.<br>• Can record when a visitor enters and leaves.<br>• Can search recent visits and the archive. |

## Technical Diagrams

### Business Process Flowchart

![Business Process Flow Chart](./assets/images/visitor-gate-pass-business-process-flowchart.png)

### Entity Relationship Diagram

![Entity Relationship Diagram](./assets/images/visitor-gate-pass-erd.png)

### System Architecture

![Entity Relationship Diagram](./assets/images/visitor-gate-pass-architecture-overview.png)

## Project Members and Roles

| Member                 | Role                                        |
| ---------------------- | ------------------------------------------- |
| James Angelo T. Inopia | • Project Manager<br>• Full-Stack Developer |
| Harvey Tyson Ablen     | • Full-Stack Developer                      |
| Noah Gabriel K. Lonoy  | • UI/UX                                     |

## Links for Project Documentations

| Document         | Link                                                                                                              |
| ---------------- | ----------------------------------------------------------------------------------------------------------------- |
| Project Timeline | [Notion: Timeline + Kanban Board](https://app.notion.com/p/visitor-gate-pass-3f0afb6c56fa80588ce6e929efadc1f2)    |
| UI/UX            | [Figma: Design](https://www.figma.com/design/5AaSP8R0aBq6gnQbEmDZfz/Untitled?node-id=0-1&p=f&t=IOQmSWIRMIFyszM-0) |