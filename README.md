# Elastic Cluster Tuner

A web application for configuring Elastic clusters and estimating theoretical performance impacts. This tool helps customers understand how different tier configurations (hot, warm, cold, frozen, deep freeze) and hardware choices (SSD, HDD, NVMe) affect ingest rates, query latency, and overall cluster performance.

## Features

- **Tier Configuration**: Configure hot, warm, cold, frozen, and deep freeze tiers with customizable retention periods
- **Hardware Selection**: Choose between NVMe, SSD, and HDD storage with configurable node specifications
- **Performance Estimation**: Real-time calculation of:
  - Maximum ingest rate (documents per second)
  - Average query latency
  - Average ingest latency
  - Storage efficiency
  - Cost estimates
- **Deployment Types**: Support for on-premises, AWS, GCP, Azure, Elastic Cloud, and Serverless deployments
- **Interactive UI**: Modern, responsive interface with real-time performance updates

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Deployment to Vercel

1. Push your code to a Git repository (GitHub, GitLab, etc.)
2. Import your repository in [Vercel](https://vercel.com)
3. Vercel will automatically detect Next.js and configure the build settings
4. Deploy!

Alternatively, use the Vercel CLI:

```bash
npm i -g vercel
vercel
```

## How It Works

### Performance Calculations

The application uses theoretical models based on Elasticsearch performance characteristics:

- **Ingest Capacity**: Calculated based on tier type, storage type, CPU cores, memory, and node count
- **Query Latency**: Estimated using tier performance multipliers, storage type, and hardware specifications
- **Ingest Latency**: Based on tier type, storage IOPS, and throughput capabilities
- **Storage Efficiency**: Considers storage type (NVMe > SSD > HDD) for active data handling

### Tier Performance Multipliers

- **Hot**: 100% ingest, 100% query performance
- **Warm**: 80% ingest, 70% query performance
- **Cold**: 30% ingest, 40% query performance
- **Frozen**: 10% ingest, 20% query performance
- **Deep Freeze**: 5% ingest, 10% query performance

### Hardware Profiles

The application includes predefined hardware profiles:
- **SSD Small/Medium/Large**: Various SSD configurations
- **HDD Small/Medium/Large**: Cost-effective HDD options
- **NVMe Premium**: High-performance NVMe storage

## Usage

1. **Select Deployment Type**: Choose your deployment environment (on-prem, cloud, etc.)
2. **Configure Tiers**: Enable/disable tiers and set retention periods (in hours)
3. **Adjust Hardware**: Modify storage type, size, CPU cores, and memory for each tier
4. **View Metrics**: See real-time performance estimates and cost projections

## Important Notes

⚠️ **These are theoretical estimates** based on typical Elasticsearch performance characteristics. Actual performance may vary significantly based on:
- Data structure and document size
- Query patterns and complexity
- Network latency
- Index settings and mappings
- Shard configuration
- Actual workload patterns

Use this tool as a guide for planning and comparison, not as a guarantee of actual performance.

## License

This project is provided as-is for Elastic customers and partners.
