const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/components/desktop/analytics-dashboard.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. top10AppsData
content = content.replace(
  /return list\.length > 0 \? list : \[\s*\{ name: 'Brave Browser'[\s\S]*?\];/g,
  'return list;'
);

// 2. categoryData
content = content.replace(
  /return res\.length > 0 \? res : \[\s*\{ name: 'Web Browser'[\s\S]*?\];/g,
  'return res;'
);

// 3. systemVsUserData
content = content.replace(
  /if \(systemMb === 0 && userMb === 0\) \{\s*systemMb = 12\.4;\s*userMb = 87\.6;\s*\}/g,
  ''
);

// 4. protocolData
content = content.replace(
  /if \(tcpCount === 0 && udpCount === 0\) \{\s*tcpCount = 68;\s*udpCount = 18;\s*\}/g,
  ''
);

// 5. portData
content = content.replace(
  /return res\.length > 0 \? res : \[\s*\{ port: '443 \(HTTPS\)'[\s\S]*?\];/g,
  'return res;'
);

// 6. socketStateData
content = content.replace(
  /return res\.length > 0 \? res : \[\s*\{ state: 'ESTABLISHED'[\s\S]*?\];/g,
  'return res;'
);

// 7. historicalData
content = content.replace(
  /const historicalData = useMemo\(\(\) => \{[\s\S]*?if \(dailyTotals && dailyTotals\.length > 0\) \{([\s\S]*?)\}\s*\/\/ Realistic fallback[\s\S]*?return days\.map[\s\S]*?\}\);\s*\}, \[dailyTotals\]\);/g,
  `const historicalData = useMemo(() => {
    let cumulative = 0;
    return (dailyTotals || []).map(d => {
      const totalDay = d.total_inbound_mb + d.total_outbound_mb;
      cumulative += totalDay;
      return {
        date: d.date.slice(5),
        inbound: Number(d.total_inbound_mb.toFixed(1)),
        outbound: Number(d.total_outbound_mb.toFixed(1)),
        total: Number(totalDay.toFixed(1)),
        cumulative: Number(cumulative.toFixed(1))
      };
    });
  }, [dailyTotals]);`
);

// 8. dayOfWeekData
content = content.replace(
  /const dayOfWeekData = useMemo\(\(\) => \[\s*\{ day: 'Mon'[\s\S]*?\], \[\]\);/g,
  'const dayOfWeekData = useMemo(() => [] as any[], []);'
);

// 9. weeklyComparativeData
content = content.replace(
  /const weeklyComparativeData = useMemo\(\(\) => \[\s*\{ day: 'Mon'[\s\S]*?\], \[\]\);/g,
  'const weeklyComparativeData = useMemo(() => [] as any[], []);'
);

// 10. quotaForecastData
content = content.replace(
  /const quotaForecastData = useMemo\(\(\) => \[\s*\{ day: 'Day 1'[\s\S]*?\], \[\]\);/g,
  'const quotaForecastData = useMemo(() => [] as any[], []);'
);

// 11. hourlyDiurnalData
content = content.replace(
  /const hourlyDiurnalData = useMemo\(\(\) => \{\s*return Array\.from[\s\S]*?\}, \[\]\);/g,
  'const hourlyDiurnalData = useMemo(() => [] as any[], []);'
);

// 12. hourlySpeedData
content = content.replace(
  /const hourlySpeedData = useMemo\(\(\) => \{\s*return Array\.from[\s\S]*?\}, \[\]\);/g,
  'const hourlySpeedData = useMemo(() => [] as any[], []);'
);

// 13. conservationData
content = content.replace(
  /const conservationData = useMemo\(\(\) => \[\s*\{ category: 'Background Updates'[\s\S]*?\], \[\]\);/g,
  'const conservationData = useMemo(() => [] as any[], []);'
);

// 14. adapterData
content = content.replace(
  /const adapterData = useMemo\(\(\) => \[\s*\{ name: 'Wi-Fi \(Primary\)'[\s\S]*?\], \[\]\);/g,
  'const adapterData = useMemo(() => [] as any[], []);'
);

// 15. saturationMeterData
content = content.replace(
  /value: percent \|\| 8/g,
  'value: percent'
);

fs.writeFileSync(file, content);
console.log("Done replacing mock data.");
