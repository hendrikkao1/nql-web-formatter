const defaultValue = `
web.page_views
  during past 7d

| where
  application.name == "Confluence"

| summarize
  backendTime = page_load_time.backend.avg()
  by
  device.name

| list
  device.name,
  backendTime

| sort
  backendTime
  desc
`.trim();

export default defaultValue;
