# B2B Home Goods Demo

B2B e-commerce demo application with Lucidworks Fusion integration, featuring AI-powered Q&A via Fusion RAG.

## Features

- **Product Search**: Full-text search powered by Lucidworks Fusion
- **AI Q&A**: Conversational AI assistant using Fusion RAG
- **Faceted Navigation**: Dynamic facets for filtering products
- **Product Details**: Rich product pages with specifications, resources, and FAQs
- **Shopping Cart**: Full cart functionality with quantity management
- **Error Handling**: Comprehensive error boundaries and recovery

## Tech Stack

- **Framework**: React 18 (Create React App + CRACO)
- **UI**: Material-UI (MUI)
- **Search**: Lucidworks Fusion
- **AI**: Fusion RAG for conversational Q&A
- **Deployment**: Google Cloud Run

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Environment Setup

Create a `.env` file:

```bash
REACT_APP_FUSION_HOST=https://your-fusion-instance.com
REACT_APP_FUSION_APPLICATION=your-app-name
REACT_APP_FUSION_AUTH_TOKEN=your-api-token
```

### Running Locally

```bash
npm start
```

The app runs at http://localhost:3000

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start development server |
| `npm run build` | Build for production |
| `npm test` | Run tests |

## Project Structure

```
src/
├── api/           # API interaction (search, RAG)
├── components/    # React components
│   ├── cart/      # Shopping cart
│   ├── common/    # Shared components
│   ├── debug/     # Debug utilities
│   ├── error/     # Error handling
│   ├── integrations/  # Third-party integrations
│   ├── layout/    # Header, footer, hero
│   ├── pages/     # Page components
│   ├── product/   # Product display
│   └── search/    # Search UI
├── context/       # React context providers
├── hooks/         # Custom hooks
├── services/      # Service layer
├── styles/        # Styling
└── utils/         # Utility functions
```

## Deployment

### Google Cloud Run

```bash
./deploy_cloud_run.sh
```

## Related Projects

- [fusion-mcp-server](../../services/fusion-mcp-server/) - MCP server for AI integrations
- [signals-feed](../../services/signals-feed/) - Signal generation for Fusion
