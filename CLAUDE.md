# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **evaluation framework** for a research project that benchmarks LLM performance on music notation analysis tasks. It is the scoring/evaluation counterpart to the sibling `questioning_framework` (Python) which collects LLM responses.

The pipeline works as follows:
1. `questioning_framework` sends images of music notation to multiple LLMs (via OpenRouter/Groq) along with structured questions, and stores their responses in `responses.json`.
2. This `evaluation-framework` consumes that `responses.json` to score and compare model performance.

## Data Format

`responses.json` is the primary data file. Structure:

```
{
  "<image_filename>": {
    "<question_id>": {
      "question": "...",
      "type": "binary" | "ranking",
      "respuestas": [
        {
          "modelo": "<provider/model-name>",
          "respuesta": "<model response text>",
          "tiempo_de_respuesta": <seconds>
        }
      ]
    }
  }
}
```

- **binary** questions expect a single correct answer (e.g., notation type identification).
- **ranking** questions require qualitative evaluation of open-ended responses (e.g., tonality analysis, instrument deduction).

## Question Types

There are currently 3 question types evaluated per image:
1. Notation type identification (binary — exact match)
2. Tonality/key analysis (ranking — quality of reasoning)
3. Instrument deduction (ranking — quality of reasoning)

## Setup

```bash
pnpm install
```

Package manager: **pnpm** (v10.17.0, specified in `package.json`).

## Key Context

- The project uses Spanish for field names in data (`respuestas`, `modelo`, `tiempo_de_respuesta`) and some UI/comments, but questions are in English.
- Models evaluated include LLaMA, Gemini, and Claude variants accessed through OpenRouter.
- The system prompt used for querying is in `../questioning_framework/system_prompt.md` — it instructs models to act as OMR (Optical Music Recognition) experts and answer strictly from what's visible in the image.
