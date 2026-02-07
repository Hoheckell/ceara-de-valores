export default defineEventHandler((event) => {
  setResponseHeaders(event, {
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
  })
})