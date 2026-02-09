# B2B Home Goods - Configuration Guide

This document describes where API endpoints and credentials are configured in the application.

## Configuration Locations

### 1. Search API (Lucidworks Fusion)

**File:** `src/api/search.js`

| Setting | Line | Current Value |
|---------|------|---------------|
| Base URL | 7 | `https://lw-demoprimary-sales.b.lucidworks.cloud` |
| Application Name | 8 | `Build_Demo` |
| Default Query Profile | 9 | `Build_Demo` |
| API Key | 10 | `8b0754fc-652c-448c-88fd-96c03bbcf4eb` |
| Timeout (ms) | 11 | `10000` |

**Query Profiles** (Lines 14-21):

| Profile Key | Endpoint |
|-------------|----------|
| `default` | `Build_Demo` |
| `typeahead` | `build_demo_typeahead` |
| `suggestions` | `build_demo_typeahead` |
| `landing-page` | `build_demo_landing` |
| `pdp` | `build_demo_pdp` |
| `category` | `build_demo_category` |

**RAG Endpoints** (Lines 330-337):
- `build_demo_rag`
- `Build_Demo_rag`
- `rag`
- `ui_rag`
- `Build_Demo` (fallback)

### 2. Conversational Service (AI Q&A)

**File:** `src/services/conversationalService.js`

| Setting | Line | Current Value |
|---------|------|---------------|
| API Base URL | 3 | `https://se-demos-tools.lucidworkssales.com` |

This can be overridden via environment variable: `REACT_APP_API_BASE_URL`

**Endpoints Used:**
- `/api/health` - Health check
- `/api/ask-pdf` - Conversational Q&A

## Environment Variables

Create a `.env` file in the project root to override defaults:

```env
REACT_APP_API_BASE_URL=https://your-custom-api.com
```

## Quick Reference

To change the Fusion endpoint:
1. Open `src/api/search.js`
2. Update `API_CONFIG.baseURL` (line 7)
3. Update `API_CONFIG.application` (line 8) if using a different app
4. Update `API_CONFIG.apiKey` (line 10) with your API key

To change the Conversational AI endpoint:
1. Open `src/services/conversationalService.js`
2. Update the `API_BASE_URL` constant (line 3)
3. Or set `REACT_APP_API_BASE_URL` environment variable
