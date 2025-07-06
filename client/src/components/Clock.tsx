import React, { useState, useEffect } from 'react';
import { Clock as ClockIcon } from 'lucide-react';

export function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  return (
    <div className="flex items-center space-x-2 text-sm text-gray-600">
      <ClockIcon className="h-4 w-4" />
      <div className="flex flex-col text-right">
        <span className="font-medium">{formatTime(time)}</span>
        <span className="text-xs text-gray-500">{formatDate(time)}</span>
      </div>
    </div>
  );
}