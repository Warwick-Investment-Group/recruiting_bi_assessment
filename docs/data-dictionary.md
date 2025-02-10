# Data Dictionary

## Well Metadata (well_metadata.csv)
| Field | Type | Description |
|-------|------|-------------|
| wellId | string | Unique identifier for each well (e.g., WELL-001) |
| latitude | decimal | Well location latitude |
| longitude | decimal | Well location longitude |
| completionDate | date | Date well was completed (YYYY-MM-DD) |
| initialOilRate | decimal | Initial oil production rate (BBL/D) |
| initialGasRate | decimal | Initial gas production rate (MCF/D) |
| region | string | Operating region (SCOOP, STACK, or Merge) |

## Production Data (production_data.csv)
| Field | Type | Description |
|-------|------|-------------|
| wellId | string | Unique identifier for each well |
| date | string | Production month (YYYY-MM) |
| region | string | Operating region |
| oilProduction | decimal | Monthly oil production (BBL) |
| gasProduction | decimal | Monthly gas production (MCF) |
| waterProduction | decimal | Monthly water production (BBL) |
| runtime | decimal | Days well was operational in month |
| chemicalCost | decimal | Monthly chemical treatment cost ($) |
| maintenanceCost | decimal | Monthly maintenance cost ($) |

## Failure Events (failure_events.csv)
| Field | Type | Description |
|-------|------|-------------|
| wellId | string | Unique identifier for each well |
| date | string | Month of failure event (YYYY-MM) |
| failureType | string | Type of equipment failure |
| downtimeDays | decimal | Duration of downtime from failure |

### Notes
- All production volumes are gross (before separation)
- Costs are in USD
- Runtime is measured in days
- Failure types include: Pump, Compressor, Flowline, Chemical Pump, Controller
