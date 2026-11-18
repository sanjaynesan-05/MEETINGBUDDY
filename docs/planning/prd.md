# Product Requirements Document (PRD)

# AI Meeting Intelligence System

### **AI-Powered Meeting Intelligence System with Context-Aware Retrieval, Intent Recognition, Sentiment Analysis, and Automated Action Management**

**Version:** 1.0
**Date:** July 2026
**Prepared By:** Sanjai Nesan J

---

# Document Information

| Item         | Details                                                 |
| ------------ | ------------------------------------------------------- |
| Product Name | AI Meeting Intelligence System                          |
| Category     | Artificial Intelligence / Productivity                  |
| Platform     | Web Application                                         |
| Target Users | Organizations, Students, Teams, Researchers             |
| Technology   | React, Node.js, Express, Python, FastAPI, MongoDB, LLMs |
| Project Type | Final Year Project                                      |
| Duration     | July – September 2026                                   |

---

# 1. Executive Summary

Meetings generate enormous amounts of information including discussions, decisions, questions, tasks, risks, and commitments. Most organizations still rely on manual note-taking, which often results in lost information, forgotten action items, and inefficient collaboration.

The **AI Meeting Intelligence System** is an intelligent meeting assistant that automatically records, transcribes, analyzes, summarizes, and organizes meetings using Artificial Intelligence.

Unlike traditional meeting summarization tools, this system performs deep semantic understanding of conversations by identifying:

* Meeting topics
* Speaker contributions
* Sentiment trends
* Intent of statements
* Decisions
* Questions
* Risks
* Tasks
* Deadlines
* Context from previous meetings using Retrieval-Augmented Generation (RAG)

The system also recommends priorities for action items and enables users to search across previous meetings using natural language.

---

# 2. Product Vision

To build an intelligent AI-powered meeting assistant capable of understanding human conversations, preserving organizational knowledge, and improving productivity by transforming meeting discussions into actionable insights.

---

# 3. Problem Statement

Organizations spend thousands of hours in meetings.

Common problems include:

* Manual note taking
* Missing action items
* Forgotten deadlines
* Difficult retrieval of previous discussions
* No emotional understanding
* Lack of meeting analytics
* Repeated discussions due to poor documentation
* Searching previous meetings is almost impossible

Current AI meeting tools mainly generate summaries.

They rarely understand:

* why something was discussed
* who made decisions
* urgency
* emotions
* previous context

---

# 4. Objectives

The system aims to:

* Automatically transcribe meetings
* Generate AI summaries
* Detect speakers
* Perform sentiment analysis
* Recognize conversational intent
* Extract action items
* Assign priorities
* Build searchable meeting knowledge
* Enable semantic search
* Use RAG for contextual responses
* Improve team productivity

---

# 5. Target Users

## Primary Users

* Software Companies
* Startups
* Research Teams
* Colleges
* Student Project Teams
* Business Organizations

## Secondary Users

* HR Teams
* Project Managers
* Team Leads
* Product Managers
* Faculty Members

---

# 6. User Personas

## Persona 1 – Project Manager

Needs

* Track decisions
* Monitor tasks
* Review summaries
* Identify pending work

Pain Points

* Missed deadlines
* Forgotten commitments
* Long meetings

Expected Solution

AI-generated tasks with priorities.

---

## Persona 2 – Software Developer

Needs

* Understand previous discussions
* Search technical decisions
* Track bugs discussed

Expected Solution

Natural language search over previous meetings.

---

## Persona 3 – Student Team

Needs

* Record project meetings
* Assign work
* Track progress

Expected Solution

Automatic meeting minutes and task assignment.

---

# 7. Product Scope

The project covers:

## Included

Meeting Recording

Speech-to-Text

Speaker Identification

Meeting Summarization

Action Item Extraction

Decision Detection

Question Detection

Intent Recognition

Sentiment Analysis

Emotion Recognition

Meeting Search

RAG

Meeting Dashboard

Analytics

Calendar Export

Task Prioritization

---

## Excluded

Video Conferencing

Email Client

Project Management Tool

Chat Application

Voice Calling

---

# 8. Functional Requirements

---

## Module 1

### Authentication

Users can

* Register
* Login
* Logout
* Reset Password

---

## Module 2

### Meeting Upload

Users can upload

* MP3
* WAV
* M4A
* MP4

The system validates

* File size
* Format

---

## Module 3

### Audio Processing

Process

Audio

↓

Noise Reduction

↓

Speech Segmentation

↓

Speaker Detection

↓

Speech Recognition

↓

Transcript

---

## Module 4

### Speaker Diarization

The system identifies

Speaker 1

Speaker 2

Speaker 3

with timestamps.

Example

```
00:01

John:
Good morning everyone.

00:14

Sarah:
Let's discuss sprint planning.

00:29

John:
We need API completion.
```

---

## Module 5

### Meeting Summarization

The LLM generates

Executive Summary

Key Discussion Points

Major Decisions

Challenges

Future Plans

---

## Module 6

### Intent Recognition

Each sentence is classified into categories.

Examples

| Statement                    | Intent     |
| ---------------------------- | ---------- |
| Can we deploy tomorrow?      | Question   |
| Let's release Friday.        | Decision   |
| Please update documentation. | Task       |
| I approve the proposal.      | Approval   |
| This needs investigation.    | Issue      |
| We should postpone it.       | Suggestion |

---

## Module 7

### Sentiment Analysis

Detects

Positive

Neutral

Negative

---

Example

```
Positive

"We completed everything."

Negative

"The deployment failed."

Neutral

"The meeting starts tomorrow."
```

---

## Module 8

### Emotion Recognition

Recognizes

Happy

Excited

Frustrated

Concerned

Confused

Urgent

Satisfied

Disappointed

---

## Module 9

### Action Item Extraction

Example

Transcript

```
Rahul:

Complete API before Monday.
```

Output

Task

Complete API

Owner

Rahul

Deadline

Monday

Priority

High

---

## Module 10

### Task Prioritization

Priority is calculated using

Urgency

Deadline

Keywords

Sentiment

Importance

Priority Levels

Critical

High

Medium

Low

---

## Module 11

### Decision Detection

Example

```
We will migrate to PostgreSQL.
```

Decision stored.

---

## Module 12

### Question Detection

Example

```
Should we increase budget?
```

Stored separately.

---

## Module 13

### Meeting Knowledge Base

Each meeting becomes searchable.

Knowledge includes

Summary

Transcript

Embeddings

Tasks

Sentiment

Topics

Decisions

Questions

---

## Module 14

### Retrieval Augmented Generation (RAG)

The system stores vector embeddings.

User asks

```
What did we decide about authentication?
```

System retrieves

Relevant meetings

↓

Relevant transcript chunks

↓

LLM

↓

Answer

---

## Module 15

### Semantic Search

Example Queries

```
Meetings discussing MongoDB

```

```
Sprint planning meetings

```

```
Budget approval

```

```
Authentication discussion

```

---

## Module 16

### Analytics Dashboard

Displays

Number of meetings

Average duration

Tasks completed

Pending tasks

Positive sentiment

Negative sentiment

Meeting trends

Speaker statistics

Topic frequency

---

## Module 17

### Calendar Integration

Extracted tasks exported to

Google Calendar

Outlook

ICS File

---

## Module 18

### Notifications

Notify users about

Upcoming deadlines

Pending tasks

Overdue work

---

# 9. Non-Functional Requirements

Performance

Transcript generation under 2× audio duration.

Summary generation under 20 seconds.

Search response under 3 seconds.

Availability

99% uptime.

Security

JWT Authentication

Encrypted passwords

HTTPS

Role-based access

Scalability

Support thousands of meetings.

Reliability

Automatic backups.

Maintainability

Modular architecture.

---

# 10. User Journey

```
User Login

↓

Upload Audio

↓

Speech Recognition

↓

Speaker Detection

↓

Transcript

↓

Summary

↓

Intent Recognition

↓

Sentiment Analysis

↓

Task Extraction

↓

Priority Detection

↓

Store in Database

↓

Generate Embeddings

↓

Vector Database

↓

Dashboard

↓

Search Previous Meetings

↓

AI Answers
```

---

# 11. System Architecture

```
                User

                  │

                  ▼

          React Frontend

                  │

                  ▼

          Node.js API Server

                  │

      ┌───────────┼────────────┐

      ▼           ▼            ▼

 Authentication  MongoDB   File Storage

                  │

                  ▼

        Python AI Service

      ┌───────┬────────┬──────────┐

      ▼       ▼        ▼

 Whisper   LLM   Sentiment Model

      │       │        │

      └────────┼────────┘

               ▼

      Embedding Generator

               ▼

        Vector Database

               ▼

      Retrieval Augmented

         Generation Engine
```

---

# 12. Database Overview

Collections

Users

Meetings

Transcripts

Speakers

Summaries

Sentiments

Tasks

Questions

Decisions

Embeddings

Notifications

---

# 13. API Overview

Authentication

```
POST /api/auth/register

POST /api/auth/login

GET /api/auth/profile
```

Meetings

```
POST /api/meetings/upload

GET /api/meetings

GET /api/meetings/:id

DELETE /api/meetings/:id
```

Summary

```
GET /api/summary/:meetingId
```

Search

```
POST /api/search
```

RAG

```
POST /api/chat
```

Tasks

```
GET /api/tasks

PATCH /api/tasks/:id
```

Analytics

```
GET /api/dashboard
```

---

# 14. Success Metrics

The product will be considered successful if:

* ≥95% transcription accuracy (clear audio)
* ≥90% summary relevance
* ≥85% action-item extraction accuracy
* Search latency <3 seconds
* Positive user satisfaction (>4.5/5)
* 70% reduction in manual note-taking time

---

# 15. Risks and Mitigation

| Risk                      | Mitigation                                 |
| ------------------------- | ------------------------------------------ |
| Poor audio quality        | Noise reduction and speaker enhancement    |
| Multiple speakers overlap | Speaker diarization and confidence scoring |
| LLM hallucinations        | RAG grounding with transcript context      |
| Large meeting files       | Chunking and asynchronous processing       |
| Data privacy concerns     | Encryption, JWT, HTTPS, role-based access  |

---

# 16. Future Enhancements

* Live meeting transcription
* Real-time AI assistant during meetings
* Multi-language translation
* Automatic PowerPoint generation
* Slack integration
* Microsoft Teams integration
* Zoom integration
* Jira task creation
* GitHub issue creation
* Email summary delivery
* Voice-based meeting search
* Personalized AI meeting coach

---

# 17. Acceptance Criteria

The system shall:

* Successfully authenticate users.
* Accept supported audio/video meeting uploads.
* Generate accurate transcripts with speaker labels.
* Produce concise AI-generated summaries.
* Detect sentiments and emotions.
* Classify conversational intents.
* Extract action items, decisions, and questions.
* Prioritize tasks automatically.
* Store meeting knowledge in a searchable vector database.
* Answer natural language questions using RAG.
* Display analytics and dashboards.
* Export tasks to calendar formats.
* Maintain secure access with role-based authentication.

---

# 18. Conclusion

The **AI Meeting Intelligence System** is designed to move beyond simple transcription and summarization by providing deep conversational understanding. Through the integration of Speech-to-Text, Large Language Models, Retrieval-Augmented Generation (RAG), Intent Recognition, Sentiment & Emotion Analysis, and Automated Task Management, the platform transforms unstructured meeting conversations into a structured organizational knowledge base.

This solution helps teams reduce manual documentation, improve collaboration, accelerate decision-making, and preserve institutional knowledge, making it a strong and innovative final-year project with significant potential for research publication and real-world enterprise adoption.
