const defaultValue = `
web.events during past 24h
| where application.name == "Confluence"
| summarize usage_hours = duration.sum() / 3600 by device.name, device.operating_system.platform, device.entity
| list device.name, usage_hours, device.operating_system.platform, device.entity
| sort usage_hours desc
`;

export default defaultValue;
