const defaultValue = `
devices

| with web.errors during past 7d

| compute
  total_errors_device = number_of_errors.sum()

| where
  total_errors_device > 10

| list
  device.name,
  total_errors_device

| sort
  total_errors_device
  desc
`.trim();

export default defaultValue;
