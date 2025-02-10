// Region definitions for Oklahoma plays
const regions = {
    STACK: {
        center: { lat: 35.8, lng: -98.2 },
        radius: 0.3
    },
    SCOOP: {
        center: { lat: 34.9, lng: -97.8 },
        radius: 0.25
    },
    Merge: {
        center: { lat: 35.6, lng: -97.9 },
        radius: 0.2
    }
};

// Helper function to pad numbers with zeros
function padNumber(num, size) {
    let s = num.toString();
    while (s.length < size) s = "0" + s;
    return s;
}

// Helper function to generate location within a region
function generateLocation(region) {
    const r = Math.sqrt(Math.random()) * region.radius;
    const theta = Math.random() * 2 * Math.PI;
    return {
        latitude: region.center.lat + r * Math.cos(theta),
        longitude: region.center.lng + r * Math.sin(theta)
    };
}

// Helper function to create realistic declining production
function generateDecline(initial, months, declineRate = 0.05) {
    const result = [];
    for (let i = 0; i < months; i++) {
        result.push(initial * Math.pow(1 - declineRate, i) * (0.9 + Math.random() * 0.2));
    }
    return result;
}

// Helper function to convert array of objects to CSV
function toCSV(arr) {
    if (arr.length === 0) return '';
    const headers = Object.keys(arr[0]);
    const rows = arr.map(obj => headers.map(header => 
        typeof obj[header] === 'number' ? obj[header].toFixed(4) : obj[header]
    ));
    return [headers, ...rows].map(row => row.join(',')).join('\n');
}

// Generate well metadata
const wellCount = 75;
const monthsOfData = 24;

const wells = [];
for (let i = 0; i < wellCount; i++) {
    const region = ['SCOOP', 'STACK', 'Merge'][Math.floor(Math.random() * 3)];
    const location = generateLocation(regions[region]);
    
    wells.push({
        wellId: `WELL-${padNumber(i + 1, 3)}`,
        latitude: location.latitude,
        longitude: location.longitude,
        completionDate: new Date(2021, Math.floor(Math.random() * 12), 1).toISOString().slice(0,10),
        initialOilRate: Math.round(500 + Math.random() * 1000),
        initialGasRate: Math.round(2000 + Math.random() * 4000),
        region: region
    });
}

// Generate monthly production data
let productionData = [];
wells.forEach(well => {
    const oilDecline = generateDecline(well.initialOilRate, monthsOfData);
    const gasDecline = generateDecline(well.initialGasRate, monthsOfData);
    
    for(let month = 0; month < monthsOfData; month++) {
        const date = new Date(2022, month, 1);
        let runtime = 28 + Math.random() * 3;
        
        // Introduce some data quality issues
        if (Math.random() < 0.02) runtime = 0;  // Occasional zero runtime
        if (Math.random() < 0.01) runtime = 35; // Impossible runtime
        
        const chemicalCost = 5000 + Math.random() * 3000;
        
        productionData.push({
            wellId: well.wellId,
            date: date.toISOString().slice(0,7),
            region: well.region,
            oilProduction: Math.round(oilDecline[month]),
            gasProduction: Math.round(gasDecline[month]),
            waterProduction: Math.round(oilDecline[month] * (0.3 + Math.random() * 0.4)),
            runtime: Math.round(runtime * 10) / 10,
            chemicalCost: Math.round(chemicalCost),
            maintenanceCost: Math.round(2000 + Math.random() * 4000)
        });
    }
});

// Generate failure events
const failureTypes = ['Pump', 'Compressor', 'Flowline', 'Chemical Pump', 'Controller'];
const failures = [];
wells.forEach(well => {
    const isProblemWell = Math.random() < 0.2;
    const problemComponent = isProblemWell ? 
        failureTypes[Math.floor(Math.random() * failureTypes.length)] : null;
    
    for(let month = 0; month < monthsOfData; month++) {
        if (isProblemWell && problemComponent && Math.random() < 0.15) {
            failures.push({
                wellId: well.wellId,
                date: new Date(2022, month, 1).toISOString().slice(0,7),
                failureType: problemComponent,
                downtimeDays: Math.round((1 + Math.random() * 4) * 10) / 10
            });
        } else if (Math.random() < 0.03) {
            failures.push({
                wellId: well.wellId,
                date: new Date(2022, month, 1).toISOString().slice(0,7),
                failureType: failureTypes[Math.floor(Math.random() * failureTypes.length)],
                downtimeDays: Math.round((1 + Math.random() * 4) * 10) / 10
            });
        }
    }
});

// Write the CSV files
const fs = require('fs');

// Create data directory if it doesn't exist
if (!fs.existsSync('data')) {
    fs.mkdirSync('data');
}

// Write the files
fs.writeFileSync('data/well_metadata.csv', toCSV(wells));
fs.writeFileSync('data/production_data.csv', toCSV(productionData));
fs.writeFileSync('data/failure_events.csv', toCSV(failures));

// Print some statistics
console.log("=== Dataset Statistics ===");
console.log(`Total wells: ${wells.length}`);
console.log(`Total production records: ${productionData.length}`);
console.log(`Total failure events: ${failures.length}`);

// Count wells by region
const wellsByRegion = {};
wells.forEach(well => {
    wellsByRegion[well.region] = (wellsByRegion[well.region] || 0) + 1;
});
console.log("\n=== Wells by Region ===");
console.log(wellsByRegion);