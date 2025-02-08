export const TRIP_COMBINATIONS = [
    {
      id: '2-hours',
      label: '2 Hours Trip',
      options: [
        { sailing: 1, anchorage: 1, label: '1hr sailing + 1hr anchorage' },
        { sailing: 1.5, anchorage: 0.5, label: '1.5hrs sailing + 0.5hr anchorage' },
        { sailing: 2, anchorage: 0, label: '2hrs sailing' }
      ]
    },
    {
      id: '3-hours',
      label: '3 Hours Trip',
      options: [
        { sailing: 2, anchorage: 1, label: '2hrs sailing + 1hr anchorage' },
        { sailing: 1.5, anchorage: 1.5, label: '1.5hrs sailing + 1.5hrs anchorage' },
        { sailing: 2.5, anchorage: 0.5, label: '2.5hrs sailing + 0.5hr anchorage' }
      ]
    },
    {
      id: '4-hours',
      label: '4 Hours Trip',
      options: [
        { sailing: 2, anchorage: 2, label: '2hrs sailing + 2hrs anchorage' }, 
        { sailing: 3, anchorage: 1, label: '3hrs sailing + 1hr anchorage' },
        { sailing: 3.5, anchorage: 0.5, label: '3.5hrs sailing + 0.5hr anchorage' }
      ]
    }
  ];