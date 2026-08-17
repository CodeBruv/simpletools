interface AdCashLibrary {
  runAutoTag: (options: { zoneId: string }) => void
}

interface Window {
  aclib?: AdCashLibrary
}
